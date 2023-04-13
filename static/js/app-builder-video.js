// App Builder Video Functions 

function playOnlineVideo(id, url) {
    var el = document.getElementById(id);
    var htmlVideo = "";
    if (url.includes(".m3u8")) {
        var videoId = "video-" + Date.now();
        htmlVideo = "<video id='" + videoId + "' controls></video>";
        el.innerHTML = htmlVideo;
        var video = document.getElementById(videoId);
        if (Hls.isSupported()) {
            var hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function() { video.play(); });
        }
        else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = url;
            video.addEventListener("canplay", function() { video.play(); });
        }
    } else {
        htmlVideo = "<iframe src=\"" + url + "\" " +
            "frameborder=\"0\" " +
            "webkitallowfullscreen mozallowfullscreen allowfullscreen allow=\"autoplay\">";
        el.innerHTML = htmlVideo;
    }
}

function playVideoFile(id, filename) {
   var el = document.getElementById(id);
   var htmlVideo = "<video controls autoplay>";
   htmlVideo = htmlVideo + "<source src=\"" + filename + "\" type=\"video/mp4\">";
   htmlVideo = htmlVideo + "</video>";
   el.innerHTML = htmlVideo;
}
