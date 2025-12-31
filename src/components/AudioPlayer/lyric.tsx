import { ColorRGBObj } from "../../types";

const regex = /\[(.*?)\](.*)/;

class Lyric {
  private lyricData: { time: number; text: string }[] = [];
  private lyricCanvas: HTMLCanvasElement = document.createElement("canvas");
  private lyricCtx: CanvasRenderingContext2D | null =
    this.lyricCanvas.getContext("2d");

  // color
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

  findCurrentTimeLyric(time: number): {
    lyric: string;
    startTime: number;
    endTime: number;
  } {
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
    if (!this.lyricCtx) {
      return;
    }

    const currentTime = audio.currentTime;
    const { lyric, startTime, endTime } =
      this.findCurrentTimeLyric(currentTime);
    const fontSize = 80;
    const startY = 150;

    // 确保两个 canvas 的尺寸完全一致
    this.lyricCanvas.width = ctx.canvas.width;
    this.lyricCanvas.height = ctx.canvas.height;
    this.lyricCanvas.style.width = ctx.canvas.style.width;
    this.lyricCanvas.style.height = ctx.canvas.style.height;

    // 重置离屏 canvas 的所有状态，确保干净
    this.lyricCtx.clearRect(0, 0, this.lyricCanvas.width, this.lyricCanvas.height);
    this.lyricCtx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换矩阵

    ctx.save();
    // 重置主 canvas 的变换矩阵，确保状态一致
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 先设置主 canvas 的字体属性并测量文字宽度
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";
    const textWidth = ctx.measureText(lyric).width; // 在主 canvas 上测量，更可靠
    
    // 使用整数坐标，避免像素对齐问题
    const centerX = Math.round(ctx.canvas.width * 0.5);
    const percent = (currentTime - startTime) / (endTime - startTime);

    // 设置主 canvas 的完整属性
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    
    // 在主 canvas 上绘制白色歌词（居中，使用整数坐标）
    ctx.fillText(lyric, centerX, startY);

    // 设置离屏 canvas 的字体属性（与主 canvas 完全一致）
    this.lyricCtx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`;
    this.lyricCtx.globalAlpha = 1;
    this.lyricCtx.textBaseline = "alphabetic";
    this.lyricCtx.textAlign = "center";
    this.lyricCtx.fillStyle = `rgb(${this.r}, ${this.g}, ${this.b})`;
    
    // 在离屏 canvas 上绘制彩色歌词（使用完全相同的坐标和字体设置）
    this.lyricCtx.fillText(lyric, centerX, startY);
    
    // 清除右侧部分，实现高亮效果
    const startX = centerX - textWidth * 0.5;
    const startClearX = startX + textWidth * percent;
    this.lyricCtx.clearRect(
      startClearX,
      0,
      this.lyricCanvas.width - startClearX,
      this.lyricCanvas.height
    );
    
    // 将离屏 canvas 绘制到主 canvas（完全对齐）
    ctx.drawImage(this.lyricCanvas, 0, 0);

    ctx.restore();
  }
}

const lyric = new Lyric();

export default lyric;
