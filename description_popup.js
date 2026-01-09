document.addEventListener('DOMContentLoaded', function() {
    var versionElem = document.getElementById('extVersion');
    if (versionElem && chrome && chrome.runtime && chrome.runtime.getManifest) {
        var manifest = chrome.runtime.getManifest();
        versionElem.textContent = 'Version ' + manifest.version;
    }
}); 