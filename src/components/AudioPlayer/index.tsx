import React, { useState, useRef, useEffect, Fragment } from "react";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";
import audioAnalyser from "./audioAnalyser";
import waveformEffect from "./effect";
import { loadImage } from "../../utils";
import musicUrl from "../../music/C400003VLsik0ztbIb.mp4";
import coverUrl from "../../music/T002R300x300M000002Neh8l0uciQZ_1.webp";

enum MusicEffect {
  ARC = "arc-waveform",
  BAR = "bar-waveform",
}

const useStyles = makeStyles((theme) => ({
  root: { "& > *": { margin: theme.spacing(1) } },
}));

const AudioPlayer: React.FC = () => {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [effect, setEffect] = useState<MusicEffect>(MusicEffect.ARC);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const loopIdRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const coverRef = useRef<HTMLImageElement | null>(null);
  const lastEffect = useRef<MusicEffect>(MusicEffect.ARC);

  lastEffect.current = effect;
  const classes = useStyles();

  useEffect(() => {
    const handleResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext("2d");
    }
    const draftArray: Uint8Array = new Uint8Array(256);
    renderCurrentTime(draftArray);
    loadImage(coverUrl).then((img) => {
      coverRef.current = img as HTMLImageElement;
      if (!isPlayingRef.current) {
        renderCurrentTime(draftArray);
      }
    });
  }, []);

  useEffect(() => {
    audioAnalyser.analyser.getByteFrequencyData(audioAnalyser.buffer);
    renderCurrentTime(audioAnalyser.buffer);
  }, [size]);

  useEffect(() => {
    waveformEffect.initCapYPositionArray();
  }, [effect]);

  const renderCurrentTime = (datas: Uint8Array) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    waveformEffect.drawBlurBg(coverRef.current, ctx);

    if (lastEffect.current === MusicEffect.ARC) {
      waveformEffect.drawCover(coverRef.current, ctx);
      waveformEffect.drawArcWaveform(ctx, datas);
    }

    if (lastEffect.current === MusicEffect.BAR) {
      waveformEffect.drawBarWaveform(ctx, datas);
    }
  };

  const loopEffect = () => {
    if (!isPlayingRef.current) {
      window.cancelAnimationFrame(loopIdRef.current!);
      return;
    }

    audioAnalyser.analyser.getByteFrequencyData(audioAnalyser.buffer);
    renderCurrentTime(audioAnalyser.buffer);
    loopIdRef.current = window.requestAnimationFrame(loopEffect);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;

    audioAnalyser.createAnalyser(audioRef.current);
  };

  const handleOnPlay = () => {
    isPlayingRef.current = true;
    loopEffect();
  };

  const handleOnPause = () => {
    isPlayingRef.current = false;
  };

  return (
    <Fragment>
      <div className={`effects ${classes.root}`}>
        {Object.entries(MusicEffect).map(([key, value]) => (
          <Button
            key={key}
            variant="contained"
            color="primary"
            onClick={() => setEffect(value)}
          >
            {value}
          </Button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={size.width * window.devicePixelRatio}
        height={size.height * window.devicePixelRatio}
        style={{ width: size.width, height: size.height }}
      />
      <audio
        controls
        preload="auto"
        crossOrigin="anonymous"
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handleOnPlay}
        onPause={handleOnPause}
        onCanPlayThrough={() => console.log("canplay")}
        onSeeking={() => console.log("seeking...")}
        onSeeked={() => console.log("seeked")}
      >
        <source src={musicUrl} type="audio/mpeg" />
      </audio>
    </Fragment>
  );
};

export default AudioPlayer;
