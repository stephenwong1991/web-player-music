import { ColorRGBObj } from "../../types";
import { isSafari } from "../../utils";

class WaveformEffect {
  // color
  private r = 236;
  private g = 148;
  private b = 70;

  // arc
  private radius = Math.min(window.innerWidth, 450);
  private coverRadius = this.radius - 30;
  private rectWidth = 5; // 初始旋转角度

  // arc-line
  private arcLineMaxMultiple = 0.8;
  private arcLineMultipleStep = 0.1;
  private prevPoints: { angle: number; wave: number }[][] = [];
  private prevPointLength = 7;

  // arc-line-dotted
  private arcLineDottedMultiple = 0.3;

  // common
  private rotation = 0;

  // bar
  private capYPositionArray: number[] = [];

  waveColor(opacity = 1): string {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${opacity})`;
  }

  updateWaveColor(color: ColorRGBObj): void {
    this.r = color.r;
    this.g = color.g;
    this.b = color.b;
  }

  getColor(): ColorRGBObj {
    return {
      r: this.r,
      g: this.g,
      b: this.b,
    };
  }

  // 绘制圆角矩形（兼容 Safari）
  private fillRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  drawBlurBg(img: HTMLImageElement, ctx: CanvasRenderingContext2D): void {
    if (!img) {
      return;
    }

    if (isSafari()) {
      return;
    }

    const { width, height } = ctx.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.save();
    ctx.fillStyle = "#ffffff00";
    ctx.filter = "blur(80px)";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, -centerX, -centerY, width * 2, height * 2);
    ctx.restore();
  }

  drawCover(img: HTMLImageElement, ctx: CanvasRenderingContext2D): void {
    if (!img) {
      return;
    }

    const { width, height } = ctx.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.coverRadius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.clip();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(
      img,
      centerX - this.coverRadius,
      centerY - this.coverRadius,
      this.coverRadius * 2,
      this.coverRadius * 2
    );
    ctx.restore();
    // 更新旋转角度
    this.rotation += 0.01;
  }

  drawArcWaveform(ctx: CanvasRenderingContext2D, datas: Uint8Array): void {
    const len = datas.length;
    const offset = Math.floor((len * 2) / 3.5);
    const waveformList = new Array(offset * 2);

    for (let i = 0; i < offset; i++) {
      waveformList[i] = waveformList[waveformList.length - i - 1] = datas[i];
    }

    const { width, height } = ctx.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const startAngle = Math.PI; // 270 度
    const rectCount = waveformList.length;

    ctx.strokeStyle = ctx.fillStyle = this.waveColor();
    ctx.beginPath();

    for (let i = 0; i < rectCount; i++) {
      const rectHeight = Math.max(waveformList[i] * 0.5, 5);
      const angle = startAngle + (i / rectCount) * 2 * Math.PI;
      const rectX =
        centerX + this.radius * Math.cos(angle) - this.rectWidth / 2;
      const rectY = centerY + this.radius * Math.sin(angle) - rectHeight / 2;
      const rectAngle = angle + Math.PI / 2;

      ctx.save();
      ctx.translate(rectX + this.rectWidth / 2, rectY + rectHeight / 2);
      ctx.rotate(rectAngle);
      if (ctx.roundRect) {
        // ! chrome99+
        ctx.roundRect(
          -this.rectWidth / 2,
          -rectHeight,
          this.rectWidth,
          rectHeight,
          20
        );
      } else {
        ctx.rect(-this.rectWidth / 2, -rectHeight, this.rectWidth, rectHeight);
      }

      ctx.restore();
    }

    ctx.fill();
  }

  drawArcLineWaveform(ctx: CanvasRenderingContext2D, datas: Uint8Array): void {
    const len = datas.length;
    const offset = Math.floor((len * 2) / 3.5);
    const waveformList = new Array(offset * 2);

    for (let i = 0; i < offset; i++) {
      waveformList[i] = waveformList[waveformList.length - i - 1] = datas[i];
    }

    const { width, height } = ctx.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const startAngle = Math.PI; // 270 度
    const rectCount = waveformList.length;
    const point: { angle: number; wave: number }[] = [];

    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = ctx.fillStyle = this.waveColor();
    ctx.beginPath();

    let firstPoint = { x: 0, y: 0 };
    let prevPoint = { x: 0, y: 0 };

    for (let i = 0; i < rectCount; i++) {
      const angle = startAngle + (i / rectCount) * 2 * Math.PI;
      const pointRadius =
        this.radius + Math.max(waveformList[i] * this.arcLineMaxMultiple, 5);
      const x = centerX + pointRadius * Math.cos(angle);
      const y = centerY + pointRadius * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
        firstPoint.x = x;
        firstPoint.y = y;
      } else {
        const controlX = (x + prevPoint.x) / 2;
        const controlY = (y + prevPoint.y) / 2;
        ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, controlX, controlY);
      }

      prevPoint.x = x;
      prevPoint.y = y;

      point.push({ angle, wave: waveformList[i] });
    }

    const controlX = (firstPoint.x + prevPoint.x) / 2;
    const controlY = (firstPoint.y + prevPoint.y) / 2;
    ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, controlX, controlY);

    ctx.closePath();
    ctx.stroke();

    this.prevPoints.push(point);
    if (this.prevPoints.length > this.prevPointLength) {
      this.prevPoints.shift();
    }

    this.prevPoints.forEach((item, index) => {
      const multiple =
        this.arcLineMaxMultiple - this.arcLineMultipleStep * (index + 1);
      ctx.strokeStyle = this.waveColor(1 - index / this.prevPoints.length);
      ctx.beginPath();

      for (let i = 0; i < item.length; i++) {
        const pointRadius = this.radius + Math.max(item[i].wave * multiple, 5);
        const x = centerX + pointRadius * Math.cos(item[i].angle);
        const y = centerY + pointRadius * Math.sin(item[i].angle);
        if (i === 0) {
          ctx.moveTo(x, y);
          firstPoint.x = x;
          firstPoint.y = y;
        } else {
          const controlX = (x + prevPoint.x) / 2;
          const controlY = (y + prevPoint.y) / 2;
          ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, controlX, controlY);
        }
        prevPoint.x = x;
        prevPoint.y = y;
      }

      const controlX = (firstPoint.x + prevPoint.x) / 2;
      const controlY = (firstPoint.y + prevPoint.y) / 2;
      ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, controlX, controlY);

      ctx.closePath();
      ctx.stroke();
    });
  }

  drawArcLineDottedWaveform(
    ctx: CanvasRenderingContext2D,
    datas: Uint8Array
  ): void {
    const step = 3;
    const len = datas.length;
    const waveformList = new Array(len);

    for (let i = 0; i < len + step; i++) {
      waveformList[i] = datas[i] ?? datas[0];
    }

    const { width, height } = ctx.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const startAngle = Math.PI; // 270 度
    const rectCount = waveformList.length;

    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = ctx.fillStyle = this.waveColor(0.5);
    ctx.beginPath();

    let firstPoint = { x: 0, y: 0 };
    let prevPoint = { x: 0, y: 0 };

    for (let i = 0; i < rectCount; i += step) {
      const angle = startAngle + (i / rectCount) * 2 * Math.PI;
      const pointRadius =
        this.radius + Math.max(waveformList[i] * this.arcLineDottedMultiple, 5);
      const x = centerX + pointRadius * Math.cos(angle);
      const y = centerY + pointRadius * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
        firstPoint.x = x;
        firstPoint.y = y;
      } else {
        const controlX = (x + prevPoint.x) / 2;
        const controlY = (y + prevPoint.y) / 2;
        ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, controlX, controlY);
      }

      prevPoint.x = x;
      prevPoint.y = y;
    }

    const controlX = (firstPoint.x + prevPoint.x) / 2;
    const controlY = (firstPoint.y + prevPoint.y) / 2;
    ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, controlX, controlY);

    ctx.closePath();
    ctx.fill();
  }

  initCapYPositionArray(): void {
    this.capYPositionArray.length = 0;
  }

  drawBarWaveform(ctx: CanvasRenderingContext2D, datas: Uint8Array): void {
    const marginX = 50;
    const marginY = 300;
    const { width, height } = ctx.canvas;
    const xStart = marginX;
    const yStart = height - marginY;
    const yEnd = marginY;

    // 只使用前60%的数据
    const dataLength = Math.floor(datas.length * 0.6);
    const effectiveData = datas.slice(0, dataLength);

    const meterWidth = 24;
    const gap = 4;
    const totalWidth = width - marginX * 2;
    const meterNum = Math.floor(totalWidth / (meterWidth + gap));
    const step = Math.round(effectiveData.length / meterNum);
    const capHeight = 5;
    const len = effectiveData.length;

    // 直接使用当前颜色
    const colorRight = `rgba(${this.r}, ${this.g}, ${this.b}, 0.6)`; // 从右往左，带透明度0.6
    const color = `rgb(${this.r}, ${this.g}, ${this.b})`; // 从左往右，正常颜色

    // 先绘制从右往左（占据全部宽度，透明度0.4）
    for (let i = 0; i < meterNum; i++) {
      // 从数组末尾反向读取数据
      const reverseIndex = meterNum - 1 - i;
      const dataIndex = Math.min(reverseIndex * step, len - 1);
      const value = Math.max(effectiveData[dataIndex] * 3, 10);
      const x = xStart + i * (meterWidth + gap);

      if (this.capYPositionArray.length < meterNum) {
        this.capYPositionArray.push(value);
      }

      ctx.fillStyle = colorRight;
      
      // 绘制 cap（圆角）
      const capY = value < this.capYPositionArray[i] 
        ? yStart - --this.capYPositionArray[i]
        : (this.capYPositionArray[i] = value, yStart - value);
      this.fillRoundRect(ctx, x, capY, meterWidth, capHeight, 8);

      // 绘制条形（圆角）
      this.fillRoundRect(
        ctx,
        x,
        yStart - value + capHeight,
        meterWidth,
        value,
        8
      );
    }

    // 再绘制从左往右（占据全部宽度，正常颜色）
    for (let i = 0; i < meterNum; i++) {
      const dataIndex = Math.min(i * step, len - 1);
      const value = Math.max(effectiveData[dataIndex] * 3, 10);
      const x = xStart + i * (meterWidth + gap);

      ctx.fillStyle = color;
      
      // 绘制 cap（圆角）
      this.fillRoundRect(ctx, x, yStart - value, meterWidth, capHeight, 8);

      // 绘制条形（圆角）
      this.fillRoundRect(
        ctx,
        x,
        yStart - value + capHeight,
        meterWidth,
        value,
        8
      );
    }
  }
}

const waveformEffect = new WaveformEffect();

export default waveformEffect;
