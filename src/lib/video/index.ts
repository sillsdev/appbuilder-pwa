enum VideoType {
    None = 'none',
    YouTube = 'youtube',
    Vimeo = 'vimeo',
    Jesus = 'jesus',
    Gospel = 'gospel',
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
        } else if (url.toLowerCase().endsWith('.mp4')) {
            type = VideoType.Mp4;
        } else if (url.toLowerCase().endsWith('.m3u8')) {
            type = VideoType.Hls;
        }
    }

    return type;
}

export function createVideoBlock(document: Document, video: any, index: any): HTMLElement {
    const type = getVideoType(video.onlineUrl);
    const videoBlockDiv = document.createElement('div');
    videoBlockDiv.classList.add('video-block');
    const videoContainerDiv = document.createElement('div');
    const id = 'VIDEO' + index;
    videoContainerDiv.setAttribute('id', id);
    videoContainerDiv.classList.add('video-container');
    switch (type) {
        case VideoType.Mp4:
        case VideoType.YouTube:
        case VideoType.Vimeo:
        case VideoType.Hls:
        case VideoType.Gospel:
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
        "url('images/" + video.thumbnail + "')"
    );
    const videoLink = document.createElement('a');
    videoLink.setAttribute('href', '#');
    videoLink.setAttribute(
        'onclick',
        "playOnlineVideo('" + id + "', '" + video.onlineUrl + "'); return false;"
    );

    const videoImg = document.createElement('img');
    videoImg.setAttribute('src', 'video_play_01.svg');
    videoLink.appendChild(videoImg);
    videoContainerDiv.appendChild(videoLink);

    const videoTitleDiv = document.createElement('div');
    videoTitleDiv.classList.add('video-title');
    const videoTitleSpan = document.createElement('span');
    videoTitleSpan.classList.add('video-title');
    const textNode = document.createTextNode(video.title);
    videoTitleSpan.appendChild(textNode);
    videoTitleDiv.appendChild(videoTitleSpan);

    videoBlockDiv.appendChild(videoContainerDiv);
    videoBlockDiv.appendChild(videoTitleDiv);
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
    script.src = 'js/app-builder-video.js';
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
