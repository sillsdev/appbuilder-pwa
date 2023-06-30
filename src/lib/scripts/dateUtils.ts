import { get } from 'svelte/store';
import { t } from '$lib/data/stores';

export function isSameDay(date1: Date, date2: Date): boolean {
    const day1 = date1.toISOString().split('T')[0];
    const day2 = date2.toISOString().split('T')[0];
    return day1 === day2;
}

export function isToday(date: Date): boolean {
    return isSameDay(new Date(), date);
}

export function isYesterday(date1: Date): boolean {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return isSameDay(date, date1);
}

export function formatDateAndTime(date: Date): string {
    let format = ' | ' + date.toLocaleTimeString();
    if (isToday(date)) {
        format = get(t)['Date_Today'] + format;
    } else if (isYesterday(date)) {
        format = get(t)['Date_Yesterday'] + format;
    } else {
        const day = date.toLocaleString('default', { day: '2-digit' });
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.toLocaleString('default', { year: 'numeric' });
        format = day + ' ' + month + ' ' + year + format;
    }
    return format;
}

export function formatDate(date: Date): string {
    const day = date.toLocaleString('default', { day: '2-digit' });
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.toLocaleString('default', { year: 'numeric' });
    return day + ' ' + month + ' ' + year;
}
