import React, { useState, useRef, useEffect, createRef, Fragment } from "react";
import Button from "@material-ui/core/Button";
import Backdrop from "@material-ui/core/Backdrop";
import { makeStyles } from "@material-ui/core/styles";
import { SketchPicker } from "react-color";
import MediaElement from "./media";
import audioAnalyser from "./audioAnalyser";
import waveformEffect from "./effect";
import lyric from "./lyric";
import { loadImage } from "../../utils";
import { ColorRGBObj } from "../../types";
import musicInfo from "../../mock.json";

enum MusicEffect {
  ARC = "arc",
  ARC_LINE = "arc-line",
  ARC_LINE_DOTTED = "arc-line-dotted",
  BAR = "bar",
}

// 效果名称的中文映射
const effectNameMap: Record<MusicEffect, string> = {
  [MusicEffect.ARC]: "圆环",
  [MusicEffect.ARC_LINE]: "线条",
  [MusicEffect.ARC_LINE_DOTTED]: "点线",
  [MusicEffect.BAR]: "条形",
};

const draftArray: Uint8Array = new Uint8Array(256);
const useStyles = makeStyles((theme) => ({
  root: {
    "& > *": {
      display: "flex",
      "flex-direction": "column",
      margin: theme.spacing(1),
    },
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff",
  },
}));
const getSize = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

const AudioPlayer: React.FC = () => {
  const [size, setSize] = useState(getSize());
  const [effect, setEffect] = useState<MusicEffect>(MusicEffect.ARC);
  const [color, setColor] = useState<ColorRGBObj>(waveformEffect.getColor());
  const [clickPlay, setClickPlay] = useState<boolean>(true);
  const [displayColorPicker, setDisplayColorPicker] = useState<boolean>(false);

  const canvasRef = createRef<HTMLCanvasElement>();
  const ctxRef = useRef<CanvasRenderingContext2D>();
  const mediaRef = useRef<HTMLVideoElement>();
  const loopIdRef = useRef<number>(0);
  const coverRef = useRef<HTMLImageElement>();
  const isPlayingRef = useRef<boolean>(false);
  const initialized = useRef<boolean>(false);
  const lastEffect = useRef<MusicEffect>(MusicEffect.ARC);

  lastEffect.current = effect;
  const classes = useStyles();

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    const loopEffect = () => {
      if (!isPlayingRef.current) {
        window.cancelAnimationFrame(loopIdRef.current);
        return;
      }
      audioAnalyser.analyser!.getByteFrequencyData(audioAnalyser.buffer!);
      renderCurrentTime(audioAnalyser.buffer! as Uint8Array);
      loopIdRef.current = window.requestAnimationFrame(loopEffect);
    };
    const media = mediaRef.current!;
    lyric.parseLyric(musicInfo.lyric);
    media.addEventListener("play", () => {
      isPlayingRef.current = true;
      loopEffect();
    });
    media.addEventListener("pause", () => {
      isPlayingRef.current = false;
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setSize(getSize());

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
    }

    renderCurrentTime(draftArray);
    loadImage(process.env.PUBLIC_URL + musicInfo.coverUrl).then((img) => {
      coverRef.current = img;
      if (!isPlayingRef.current) {
        renderCurrentTime(draftArray);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!audioAnalyser.analyser) {
      renderCurrentTime(draftArray);
      return;
    }
    audioAnalyser.analyser.getByteFrequencyData(audioAnalyser.buffer!);
    renderCurrentTime(audioAnalyser.buffer! as Uint8Array);
  }, [size, color]);

  useEffect(() => {
    if (!audioAnalyser.analyser || !audioAnalyser.buffer) {
      return;
    }
    waveformEffect.initCapYPositionArray();
    audioAnalyser.analyser.getByteFrequencyData(audioAnalyser.buffer);
    renderCurrentTime(audioAnalyser.buffer as Uint8Array);
  }, [effect]);

  const renderCurrentTime = (datas: Uint8Array<ArrayBufferLike>): void => {
    if (!ctxRef.current || !coverRef.current) {
      return;
    }

    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    waveformEffect.drawBlurBg(coverRef.current, ctx);

    if (lastEffect.current === MusicEffect.ARC) {
      waveformEffect.drawCover(coverRef.current, ctx);
      waveformEffect.drawArcWaveform(ctx, datas);
    }

    if (lastEffect.current === MusicEffect.ARC_LINE) {
      waveformEffect.drawCover(coverRef.current, ctx);
      waveformEffect.drawArcLineWaveform(ctx, datas);
    }

    if (lastEffect.current === MusicEffect.ARC_LINE_DOTTED) {
      waveformEffect.drawArcLineDottedWaveform(ctx, datas);
      waveformEffect.drawCover(coverRef.current, ctx);
    }

    if (lastEffect.current === MusicEffect.BAR) {
      waveformEffect.drawBarWaveform(ctx, datas);
    }

    lyric.drawLyric(mediaRef.current as HTMLVideoElement, ctx);
  };

  const handleChangeColor = (color): void => {
    setColor(color.rgb);
    waveformEffect.updateWaveColor(color.rgb);
    lyric.updateColor(color.rgb);
  };

  return (
    <Fragment>
      <div className={`effects ${classes.root}`}>
        {Object.entries(MusicEffect).filter(([key]) => key !== 'ARC_LINE_DOTTED').map(([key, value]) => (
          <Button
            key={key}
            variant="contained"
            {...(effect === value ? { color: "primary" } : {})}
            onClick={() => setEffect(value)}
          >
            {effectNameMap[value]}
          </Button>
        ))}
      </div>
      <div className="sketchPicker">
        <Button
          variant="contained"
          color="primary"
          style={{ color: `rgb(${color.r}, ${color.g}, ${color.b})` }}
          onClick={() => setDisplayColorPicker((state) => !state)}
        >
          改变颜色
        </Button>
        {displayColorPicker && (
          <SketchPicker
            disableAlpha
            color={color}
            onChange={handleChangeColor}
          />
        )}
      </div>
      <div className="bg" style={{ backgroundImage: `url(${process.env.PUBLIC_URL + musicInfo.coverUrl})` }}></div>
      <canvas
        className="canvas"
        ref={canvasRef}
        width={size.width * window.devicePixelRatio}
        height={size.height * window.devicePixelRatio}
        style={{ width: size.width, height: size.height }}
      />
      <MediaElement
        ref={mediaRef}
        src={process.env.PUBLIC_URL + musicInfo.fileUrl}
      />
      <Backdrop
        className={classes.backdrop}
        style={{ cursor: "pointer" }}
        open={clickPlay}
        onClick={() => {
          setClickPlay(false);
          audioAnalyser.initAnalyser();
          audioAnalyser.createAnalyser(mediaRef.current!);
          mediaRef.current?.play();
        }}
      >
        <span style={{ fontSize: 50, fontWeight: "bold" }}>
          点击任意区域播放
        </span>
      </Backdrop>
    </Fragment>
  );
};

export default AudioPlayer;
