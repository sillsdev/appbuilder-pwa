import type { ScriptureConfig } from '$config';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import path from 'path';
import { PlanDataItem, PlansData } from '../src/lib/data/plansData';
import { Task, TaskOutput } from './Task';
import { ConfigTaskOutput } from './convertConfig';

function changeFileExtension(filename: string, ext: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
        // No extension found, just append .json
        return `${filename}.${ext}`;
    } else {
        // Replace existing extension with .json
        return `${filename.substring(0, lastDotIndex)}.${ext}`;
    }
}

export function convertPlans(
    dataDir: string,
    scriptureConfig: ScriptureConfig,
    verbose: number
): PlansTaskOutput {
    const plansDir = path.join(dataDir, 'plans');
    const destDir = path.join('static', 'plans');
    if (existsSync(plansDir)) {
        if (existsSync(destDir)) {
            rmSync(destDir, { recursive: true });
        }
        mkdirSync(destDir);
    } else {
        if (existsSync(destDir)) {
            rmSync(destDir, { recursive: true });
        }
    }

    const files: any[] = [];
    const planConfig = scriptureConfig.plans?.plans;
    if (planConfig) {
        for (const plan of planConfig) {
            if (plan.image) {
                const srcFile = path.join(plansDir, plan.image.file);
                const destFile = path.join(destDir, plan.image.file);
                copyFileSync(srcFile, destFile);
            }
            if (plan.filename) {
                const convertedPlan = convertPlan(path.join(plansDir, plan.filename));

                files.push({
                    path: path.join(destDir, changeFileExtension(plan.filename, 'json')),
                    content: JSON.stringify(convertedPlan, null, 2)
                });
            }
        }
    }

    return {
        files,
        taskName: 'ConvertPlans'
    };
}

function parseLocalizedLabel(input: string, label: { [lang: string]: string } = {}) {
    const regex = /^\[([a-zA-Z]+)\]\s*(.*)$/;
    const match = input.match(regex);

    let lang = 'default';
    let message = input;
    if (match) {
        // If there's a match, return the captured language tag and the message
        lang = match[1];
        message = match[2];
    }
    label[lang] = message;
    return label;
}

function convertPlan(srcFile: string): PlansData {
    const planSFM = readFileSync(srcFile, 'utf-8');
    let id = '';
    let title: { [lang: string]: string } = {};
    let description: { [lang: string]: string } = {};
    const items: PlanDataItem[] = [];
    let item: PlanDataItem = { day: 0, refs: [] };
    for (const line of planSFM.split(/\r?\n/)) {
        const [tag, ...parts] = line.split(' ');
        const value = parts.join(' ');

        switch (tag.toLowerCase()) {
            case '\\id':
                id = value;
                break;

            case '\\title':
                title = parseLocalizedLabel(value, title);
                break;

            case '\\descr':
                description = parseLocalizedLabel(value, description);
                break;

            case '\\day':
                if (item.day > 0) {
                    items.push(item);
                }
                item = { day: Number(value), refs: [] };
                break;

            case '\\ref':
                item.refs.push(value);
                break;

            case '\\heading':
                item.heading = parseLocalizedLabel(value, item.heading);
                break;
        }
    }

    if (item.day > 0) {
        items.push(item);
    }

    return {
        id,
        title,
        description,
        items
    };
}

export interface PlansTaskOutput extends TaskOutput {
    taskName: 'ConvertPlans';
}

export class ConvertPlans extends Task {
    public triggerFiles: string[] = ['appdef.xml', 'plans'];

    constructor(dataDir: string) {
        super(dataDir);
    }
    public run(verbose: number, outputs: Map<string, TaskOutput>): PlansTaskOutput {
        const config = outputs.get('ConvertConfig') as ConfigTaskOutput;
        const scriptureConfig = config.data as ScriptureConfig;

        return convertPlans(this.dataDir, scriptureConfig, verbose);
    }
}
