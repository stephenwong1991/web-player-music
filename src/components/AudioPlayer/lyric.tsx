import { ColorRGBObj } from "../../types";

type LyricItem = {
  time: number;
  text: string;
}

type CurrentTimeLyricContent = {
  lyric: string;
  startTime: number;
  endTime: number;
}

const regex = /\[(.*?)\](.*)/;

class Lyric {
  private lyricData: LyricItem[] = [];
  private lyricCanvas: HTMLCanvasElement = document.createElement("canvas");
  private lyricCtx: CanvasRenderingContext2D = this.lyricCanvas.getContext("2d")!;

  // default color
  private r: number = 236;
  private g: number = 148;
  private b: number = 70;

  parseLyric(lyric: string[]): void {
    this.lyricData = [];
    for (let i = 0; i < lyric.length; i++) {
      const matches = lyric[i].match(regex);
      if (matches) {
        const time = matches[1];
        const text = matches[2];
        const timeParts = time.split(":");
        const minutes = Number(timeParts[0]);
        const seconds = Number(timeParts[1]);
        const totalSeconds = minutes * 60 + seconds;
        this.lyricData.push({ time: totalSeconds, text: text });
      }
    }
  }

  updateColor(color: ColorRGBObj): void {
    this.r = color.r;
    this.g = color.g;
    this.b = color.b;
  }

  findCurrentTimeLyric(time: number): CurrentTimeLyricContent {
    for (let i = 0; i < this.lyricData.length; i++) {
      const next = Math.min(i + 1, this.lyricData.length - 1);
      if (time >= this.lyricData[i].time && time < this.lyricData[next].time) {
        return {
          lyric: this.lyricData[i].text,
          startTime: this.lyricData[i].time,
          endTime: this.lyricData[next].time,
        };
      }
    }
    return {
      lyric: "",
      startTime: 0,
      endTime: 0,
    };
  }

  drawLyric(audio: HTMLAudioElement, ctx: CanvasRenderingContext2D): void {
    const { currentTime } = audio;
    const {
      lyric,
      startTime,
      endTime
    } = this.findCurrentTimeLyric(currentTime);
    const fontSize = 80;
    const startY = 150;
    const { canvas } = ctx;
    const { width, height } = canvas;

    ctx.save();
    ctx.font = `bold ${fontSize}px serif`;
    ctx.globalAlpha = 1;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";

    const textWidth = ctx.measureText(lyric).width;
    const startX = width * 0.5 - textWidth * 0.5;
    const percent = (currentTime - startTime) / (endTime - startTime);
    const startClearX = startX + textWidth * percent;

    ctx.fillText(lyric, startX, startY);

    this.lyricCanvas.width = width;
    this.lyricCanvas.height = height;
    this.lyricCanvas.style.width = canvas.style.width;
    this.lyricCanvas.style.height = canvas.style.height;
    this.lyricCtx.font = `bold ${fontSize}px serif`;
    this.lyricCtx.globalAlpha = 1;
    this.lyricCtx.textBaseline = "bottom";
    this.lyricCtx.textAlign = "left";
    this.lyricCtx.fillStyle = `rgb(${this.r}, ${this.g}, ${this.b})`;
    this.lyricCtx.fillText(lyric, startX, startY);
    this.lyricCtx.clearRect(startClearX, 0, width - startClearX, height);

    ctx.drawImage(this.lyricCanvas, 0, 0);
    ctx.restore();
  }
}

const lyric = new Lyric();

export default lyric;
