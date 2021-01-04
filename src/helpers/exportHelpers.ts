import * as workerTimers from "worker-timers"
import GIF from "gif.js"
import {waitForEvent} from "./domHelpers";
import {createCanvas} from "./canvasHelpers";
import {downloadBlob} from "./downloadHelpers";
import {getRecorderMimeType} from "./mediaHelpers";
import type {Rect, Range, Quality} from "./utilityTypes";
import { isInRange, cutIntersects } from "../helpers/videoHelpers";

const MEGABYTE = 1000 * 1000;

const bitRateForQuality = {
    high: 5 * MEGABYTE,
    medium: 2.5 * MEGABYTE,
    low: MEGABYTE
};

const gifQualityForQuality = {
    high: 5,
    medium: 10,
    low: 15,
}

type ExportSettings = {
    srcVideoUrl: string;
    crop: Rect;
    trim: Range,
    frameRate: number;
    quality: Quality
    scale: number,
    speed: number,
    cuts: Range[],
    videoDetails: any
}

type ProgressCallback = (progress: number) => void

const setupVideo = async (srcVideoUrl: string, start: number): Promise<HTMLVideoElement> => new Promise(async (resolve, reject) => {
    const video = document.createElement("video");

    video.onerror = () => reject(new Error(`Failed to load video`));
    video.src = srcVideoUrl;

    video.currentTime = start;
    if (start) await waitForEvent(video, "seeked", 1000);

    return resolve(video);
});

const getCaptureProgress = (currentTime: number, trim: {start: number, end: number}, cuts: Range[]): number => {
    const cutsTime = cuts.reduce((accum,cut) => accum + (cut.end - cut.start), 0);
    return (currentTime - trim.start)/(trim.end - trim.start - cutsTime)
}

export const exportGif = async ({srcVideoUrl, crop, trim, frameRate, quality, scale, speed, cuts, videoDetails}: ExportSettings, updateProgressCallback?: ProgressCallback): Promise<Blob> => new Promise(async (resolve) => {
    const video = await setupVideo(srcVideoUrl, trim.start);
    const {context, drawImage} = createCanvas(crop, scale);
    const gif = new GIF({
        workers: 1,
        quality: gifQualityForQuality[quality],
        width: crop.width * scale,
        height: crop.height * scale
    });

    gif.on("finished", (blob, ) => {
        downloadBlob(blob, "bredit-recording.gif");
        resolve(blob);
    });

    if (updateProgressCallback) {
        gif.on("progress", renderProcess =>
            updateProgressCallback(0.5 + renderProcess / 2))
    }

    let lastFrameCapturedAt = Date.now() - (1000 / frameRate) - 1;
    const interval = workerTimers.setInterval(() => {

        if (Date.now() - lastFrameCapturedAt < 1000 / frameRate) return;
        const vidTime = video.currentTime;
        let cutIdx = cutIntersects(cuts, vidTime / videoDetails.duration);

            if (cuts.length && (typeof cutIdx == 'number')) {
                video.currentTime = (cuts[cutIdx].end + 0.01) * videoDetails.duration;
            }
        if (vidTime <= trim.end && (typeof cutIdx != 'number')) {
            drawImage(video);
            const delay = Date.now() - lastFrameCapturedAt;
            gif.addFrame(context, {copy: true, delay})
            updateProgressCallback?.(getCaptureProgress(vidTime, trim, cuts) / 2);
        }
        if (vidTime >= trim.end) {
            workerTimers.clearInterval(interval);
            gif.render()
        }
        lastFrameCapturedAt = Date.now();
    }, 1);

    video.onpause = () => {
        if (video.currentTime < trim.end)
            video.play()
    };
    video.playbackRate = speed
    await video.play();
});

export const exportVideo = ({srcVideoUrl, crop, trim, frameRate, quality, scale, speed, cuts, videoDetails}: ExportSettings, updateProgressCallback: ProgressCallback): Promise<Blob> =>
    new Promise(async (resolve, reject) => {
        const video = await setupVideo(srcVideoUrl, trim.start);
        const {canvas, drawImage} = createCanvas(crop, scale);
        // @ts-ignore
        const stream = canvas.captureStream() as MediaStream;

        // add audio
        let ctx = new AudioContext();
        let dest = ctx.createMediaStreamDestination();
        let sourceNode = ctx.createMediaElementSource(video);
        sourceNode.connect(dest);
        sourceNode.connect(ctx.destination);
        let audioTrack = dest.stream.getAudioTracks()[0];
        if(audioTrack) {
            stream.addTrack(audioTrack);
        }

        // @ts-ignore
        const recorder = new MediaRecorder(stream, {
            mimeType: getRecorderMimeType(),
            videoBitsPerSecond: bitRateForQuality[quality],
        });

        recorder.ondataavailable = ({data}: { data: BlobPart }) => {
            const blob = new Blob([data], {type: "video/webm"});
            downloadBlob(blob, "bredit-recording.webm");
            resolve(blob);
        };

        let lastFrameCapturedAt = 0;
        const interval = workerTimers.setInterval(() => {
            if (Date.now() - lastFrameCapturedAt < 1000 / frameRate) return;
            const vidTime = video.currentTime;
            let cutIdx = cutIntersects(cuts, vidTime / videoDetails.duration);
                if (cuts.length && (typeof cutIdx == 'number')) {
                    video.currentTime = (cuts[cutIdx].end + 0.01) * videoDetails.duration;
                }
            if (vidTime <= trim.end && (typeof cutIdx != 'number')) {
                drawImage(video);
                updateProgressCallback?.(getCaptureProgress(vidTime, trim, cuts));
            }
            if (vidTime >= trim.end) {
                workerTimers.clearInterval(interval);
                recorder.stop();
            }

            lastFrameCapturedAt = Date.now();
        }, 1);

        recorder.onerror = () => {
            workerTimers.clearInterval(interval);
            reject(new Error(`Failed to record video`));
        };
        video.addEventListener("play", () => recorder.start(), {once: true});
        video.onpause = () => {
            if (video.currentTime < trim.end)
                video.play()
        };
        video.playbackRate = speed
        video.volume = 0
        await video.play();
    });
