import { base } from '$app/paths';
import config from '$lib/data/config';

enum VideoType {
    None = 'none',
    YouTube = 'youtube',
    Vimeo = 'vimeo',
    Jesus = 'jesus',
    Gospel = 'gospel',
    Daily = 'daily',
    Other = 'other',
    Mp4 = 'mp4',
    Hls = 'hls'
}

export function getVideoType(url: string): VideoType {
    let type = VideoType.None;

    if (url && url.length > 0) {
        if (url.includes('youtube') || url.includes('youtu.be')) {
            type = VideoType.YouTube;
        } else if (url.includes('vimeo')) {
            type = VideoType.Vimeo;
        } else if (url.includes('api.arclight.org')) {
            type = VideoType.Jesus;
        } else if (url.includes('dbt.io')) {
            type = VideoType.Gospel;
        } else if (url.includes('dai.ly')) {
            type = VideoType.Daily;
        } else if (url.toLowerCase().endsWith('.mp4')) {
            type = VideoType.Mp4;
        } else if (url.toLowerCase().endsWith('.m3u8')) {
            type = VideoType.Hls;
        }
    }

    return type;
}

function getYouTubeVideoId(url: string): string {
    let id = '';

    // Regular expression for YouTube URL pattern (e.g., youtube.com/watch?v=...)
    let pattern = /https:\/\/(?:www\.)?youtube\.(?:\w+)\/watch\?v=([a-zA-Z0-9-_]+)(?:&.+)*/;
    let match = url.match(pattern);

    if (match) {
        // If match is found, extract the video ID
        id = match[1];
    } else {
        // Regular expression for shortened YouTube URL pattern (e.g., youtu.be/...)
        pattern = /https:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9-_]+)(?:&.+)*/;
        match = url.match(pattern);

        if (match) {
            id = match[1];
        }
    }

    return id;
}

export function getEmbeddedVideoUrl(
    videoUrl: string,
    autoplay: boolean,
    features: { [key: string]: any }
) {
    let returnUrl = videoUrl;
    const type = getVideoType(videoUrl);

    switch (type) {
        case VideoType.YouTube:
            // YouTube video
            // Transform https://www.youtube.com/watch?v=abcdefghijk to https://www.youtube.com/embed/abcdefghijk
            const videoId = getYouTubeVideoId(videoUrl);
            if (videoId) {
                returnUrl = 'https://www.youtube.com/embed/' + videoId;
                let hasParams = false;

                if (autoplay) {
                    returnUrl += '?audioplay=1';
                    hasParams = true;
                }

                if (features && features['video-youtube-related-same-channel']) {
                    // After Sept 2018, you will not be able to disable related videos.
                    // Instead, if the rel parameter is set to 0, related videos will come
                    // from the same channel as the video that was just played.
                    // https://developers.google.com/youtube/player_parameters
                    returnUrl += hasParams ? '&' : '?';
                    returnUrl += 'rel=0';
                }
            }
            break;

        case VideoType.Vimeo:
            // Vimeo video
            // Transform https://vimeo.com/12345678 to https://player.vimeo.com/video/12345678
            let pattern = /https:\/\/(?:www\.)?vimeo\.(\w+)\/([0-9]+)/;
            let match = returnUrl.match(pattern);

            if (match) {
                // Construct the Vimeo embed URL
                returnUrl = `https://player.vimeo.com/video/${match[2]}`;

                // Add autoplay parameter if autoplay is true
                if (autoplay) {
                    returnUrl += '?autoplay=1';
                }
            }
            break;

        case VideoType.Daily:
            pattern = /https?:\/\/dai\\.ly\/(.*)/;
            match = returnUrl.match(pattern);

            if (match) {
                returnUrl = `https://www.dailymotion.com/embed/video/${match[1]}`;
            }
            break;

        case VideoType.Jesus:
            // Jesus Film Media
            // Get the embed code from https://www.jesusfilm.org/watch, select video and click Share > Embed Code
            // Example:
            // https://api.arclight.org/videoPlayerUrl?refId=1_20917-jf6144-0-0&apiSessionId=5a1bda77c898d6.05342318&playerStyle=default&player=bc.vanilla5
            if (!returnUrl.includes('playerStyle')) {
                returnUrl = returnUrl + '&playerStyle=default&player=bc.vanilla5';
            }
            break;

        case VideoType.Hls:
            // Do nothing
            break;
    }

    return returnUrl;
}

export function createVideoBlockFromUrl(
    document: Document,
    videoUrl: string,
    features: { [key: string]: any }
): HTMLElement {
    const url = getEmbeddedVideoUrl(videoUrl, false, features);

    const videoBlockDiv = document.createElement('div');
    videoBlockDiv.classList.add('video-block');
    const videoContainerDiv = document.createElement('div');
    videoContainerDiv.classList.add('video-container');
    videoBlockDiv.appendChild(videoContainerDiv);

    videoContainerDiv.classList.add('video-16-9');
    const iframe = document.createElement('iframe');
    iframe.setAttribute('width', '420');
    iframe.setAttribute('src', url);
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('webkitallowfullscreen', '');
    iframe.setAttribute('mozallowfullscreen', '');
    iframe.setAttribute('allowfullscreen', '');
    videoContainerDiv.appendChild(iframe);

    return videoBlockDiv;
}

export function createVideoBlock(document: Document, video: any, index: any): HTMLElement {
    const type = getVideoType(video.onlineUrl);
    const videoBlockDiv = document.createElement('div');
    videoBlockDiv.classList.add('video-block');
    const videoContainerDiv = document.createElement('div');
    const id = 'VIDEO' + index;
    videoContainerDiv.setAttribute('id', id);
    videoContainerDiv.classList.add('video-container');

    let videoUrl = video.onlineUrl;

    switch (type) {
        case VideoType.YouTube:
            if (!config.mainFeatures['video-youtube-related-same-channel']) {
                videoUrl += (videoUrl.includes('?') ? '&' : '?') + 'rel=0';
            }
            videoContainerDiv.classList.add('video-YouTube', 'video-16-9');
            break;
        case VideoType.Mp4:
        case VideoType.Vimeo:
        case VideoType.Hls:
        case VideoType.Gospel:
        case VideoType.Daily:
        case VideoType.Other:
            videoContainerDiv.classList.add('video-' + type, 'video-16-9');
            break;

        case VideoType.Jesus:
            videoContainerDiv.classList.add('video-' + type);
            break;

        case VideoType.None:
            videoContainerDiv.classList.add('video-16-9');
            break;
    }
    videoContainerDiv.style.setProperty(
        'background-image',
        `url('${base}/images/${video.thumbnail}')`
    );
    const videoLink = document.createElement('a');
    videoLink.setAttribute('href', '#');
    let sourceType = '';
    if (video.src) {
        sourceType = config.audio.sources[video.src].type;
    }
    if (sourceType === 'assets') {
        videoLink.setAttribute(
            'onclick',
            "playVideoFile('" + id + "', 'videos/" + video.filename + "'); return false;"
        );
    } else {
        videoLink.setAttribute(
            'onclick',
            "playOnlineVideo('" + id + "', '" + videoUrl + "'); return false;"
        );
    }
    const videoImg = document.createElement('img');
    videoImg.setAttribute('src', `${base}/video_play_01.svg`);
    videoLink.appendChild(videoImg);
    videoContainerDiv.appendChild(videoLink);
    videoBlockDiv.appendChild(videoContainerDiv);

    if (config.mainFeatures['video-show-titles'] && video.title) {
        const videoTitleDiv = document.createElement('div');
        videoTitleDiv.classList.add('video-title');
        const videoTitleSpan = document.createElement('span');
        videoTitleSpan.classList.add('video-title');
        const textNode = document.createTextNode(video.title);
        videoTitleSpan.appendChild(textNode);
        videoTitleDiv.appendChild(videoTitleSpan);
        videoBlockDiv.appendChild(videoTitleDiv);
    }

    return videoBlockDiv;
}

function hasHlsVideo(videos: any[]): boolean {
    let hasHls = false;
    for (let i = 0; i < videos.length; ++i) {
        const video = videos[i];
        const type = getVideoType(video.onlineUrl);
        if (type === VideoType.Hls || type === VideoType.Gospel) {
            hasHls = true;
        }
    }
    return hasHls;
}

export function addVideoLinks(document: Document, videos: any[]) {
    const script = document.createElement('script');
    script.id = 'js_video';
    script.type = 'text/javascript';
    script.src = `${base}/js/app-builder-video.js`;
    if (!document.getElementById(script.id)) {
        document.head.appendChild(script);
    }

    if (hasHlsVideo(videos)) {
        const script = document.createElement('script');
        script.id = 'js_hls';
        script.type = 'text/javascript';
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        if (!document.getElementById(script.id)) {
            document.head.appendChild(script);
        }
    }
}
