import { DAY } from "./timingHelpers";
import VideoStreamMerger from 'video-stream-merger';

export const recordScreen = async () => {
  // @ts-ignore
  const stream: MediaStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor: "always",
      width: 1920,
      height: 1080
    },
    audio: false
  });

  const videoPromise = recordStream(stream).then(
    videoData => new Blob([videoData], { type: "video/webm" })
  );

  const stop = async () => stream.getTracks().forEach(track => track.stop());

  return { stream, stop, videoPromise };
};

export const recordScreenAndCam = async () => {
  // @ts-ignore
  const merger: any = new VideoStreamMerger(
    {
      width: 1920,
      height: 1080
    }
  )
  // @ts-ignore
  const screenStream: MediaStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor: "always",
      width: 1920,
      height: 1080
    },
    audio: false
  });

  // @ts-ignore
  const webcamStream: MediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 1280,
      height: 720
    },
    audio: true
  });

  // Add the screen capture. Position it to fill the whole stream (the default)
  merger.addStream(screenStream, {
    x: 0, // position of the topleft corner
    y: 0,
    width: merger.width,
    height: merger.height,
    mute: true
  })

  const webcamWidth = 400
  const webcamHeight = webcamWidth / 1.78
  merger.addStream(webcamStream, {
    x: 0,
    y: merger.height - webcamHeight,
    width: webcamWidth,
    height: webcamHeight,
    mute: false
  })

  merger.start()
  const stream = merger.result

  const videoPromise = recordStream(stream).then(
    videoData => new Blob([videoData], { type: "video/webm" })
  );

  const stop = async () => {
    screenStream.getTracks().forEach(track => track.stop());
    webcamStream.getTracks().forEach(track => track.stop());
    stream.getTracks().forEach(track => track.stop());
  }

  return { stream, stop, videoPromise };
};

const isStreamOver = (stream: MediaStream) =>
  [...stream.getTracks()].every(track => track.readyState === "ended");

const recordStream = async (stream: MediaStream): Promise<BlobPart> =>
  new Promise((resolve, reject) => {
    // @ts-ignore


    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: getRecorderMimeType()
    });

    const handleTrackEnded = () => {
      if (isStreamOver(stream)) mediaRecorder.stop();
    };
    stream
      .getTracks()
      .forEach(track => track.addEventListener("ended", handleTrackEnded));

    mediaRecorder.ondataavailable = ({ data }: { data: BlobPart }) => {
      resolve(data);

    }

    mediaRecorder.onerror = () => reject(new Error(`Error recording screenStream`));

    mediaRecorder.start();
  });

export type VideoDetails = {
  width: number;
  height: number;
  duration: number; // In seconds
};

export const getVideoDetails = async (
  videoUrl: string
): Promise<VideoDetails> =>
  new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.onerror = () => reject(new Error(`Unable to load video`));
    video.onseeked = () => {
      const details = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      };
      if (details.width && details.height && details.duration) {
        resolve(details);
      } else {
        reject(new Error(`Failed to load video details`));
      }
    };
    video.setAttribute("src", videoUrl);
    video.currentTime = DAY;
  });

export const getRecorderMimeType = () =>
  [
    "video/webm; codecs=vp9,opus",
    "video/webm; codecs=vp8,opus",
    "video/webm; codecs=daala",
    "video/webm; codecs=h264",
    "video/webm"
    // @ts-ignore
  ].find(type => MediaRecorder.isTypeSupported(type));
