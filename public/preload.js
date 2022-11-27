const { ipcRenderer, contextBridge } = require('electron')

const fs = require('fs');
const videoshow = require('videoshow')
const ImageDataURI = require('image-data-uri');
const downloadsFolder = require('downloads-folder');


contextBridge.exposeInMainWorld('backend', {
    saveMP4Async: async (pngURIs, framerate, cblog) => {
        cblog('Converting URIs')
        var images = [];
        await Promise.all(pngURIs.map(async (uri, i) => (images.push(`step${i}.png`), ImageDataURI.outputFile(uri, `step${i}.png`))))


        var videoOptions = {
            fps: 2 * framerate,
            loop: 1 / framerate,
            transition: false,
            videoBitrate: 12000000,
            videoCodec: 'libx264',
            size: '1920x1080',
            format: 'mp4',
            pixelFormat: 'yuv420p'
        }

        cblog(`Caching to ffmpeg`)
        await new Promise((res, rej) => {
            videoshow(images, videoOptions)
                .save(`${downloadsFolder()}/Desmos Animation.mp4`)
                .on('start', function (command) {
                    cblog(`Joining pngs @ fps=${framerate}`)
                })
                .on('error', function (err, stdout, stderr) {
                    console.error('Error:', err)
                    console.error('ffmpeg stderr:', stderr)
                    cblog('error: ' + err)
                    rej()
                })
                .on('end', function (output) {
                    res()
                })
        })

        cblog('Cleaning up')
        await Promise.all(images.map(img => new Promise((res, rej) => fs.rm(img, () => res()))))

        cblog('Video created in /Downloads')
        ipcRenderer.send('notify', 'Desmos animation baked');
    },


    saveMP4Sync: async (pngURIs, framerate, cblog) => {

        var images = [];
        for (let i = 0; i < pngURIs.length; i++) {
            await ImageDataURI.outputFile(pngURIs[i], `step${i}.png`);
            images.push(`step${i}.png`);
            cblog(`Converting URIs [${i}/${pngURIs.length}]`)
        }

        cblog(`Preparing ffmpeg`)

        var videoOptions = {
            fps: 2 * framerate,
            loop: 1 / framerate,
            transition: false,
            videoBitrate: 12000000,
            videoCodec: 'libx264',
            size: '1920x1080',
            format: 'mp4',
            pixelFormat: 'yuv420p'
        }

        await new Promise((res, rej) => {
            videoshow(images, videoOptions)
                .save(`${downloadsFolder()}/Desmos Animation.mp4`)
                .on('start', function (command) {
                    cblog(`Joining frames @ fps=${Math.round(framerate)}`)
                })
                .on('error', function (err, stdout, stderr) {
                    console.error('Error:', err)
                    console.error('ffmpeg stderr:', stderr)
                    cblog('error: ' + err)
                    rej()
                })
                .on('end', function (output) {
                    res()
                })
        })

        for (let i = 0; i < images.length; i++) {
            await (new Promise((res, rej) => fs.rm(images[i], () => res())))
            cblog(`Cleaning up [${i}/${images.length}]`)
        }

        cblog('Video created in /Downloads')
        ipcRenderer.send('notify', 'Desmos animation baked');
    }
})