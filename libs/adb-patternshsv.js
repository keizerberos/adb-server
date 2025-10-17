
  function percentRoundFn(num) { return Math.round(num * 100) / 100; }
  function rgb2hsv(r, g, b, a) {
      r /= 255, g /= 255, b /= 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h, s, v = max;

      var d = max - min;
      s = max == 0 ? 0 : d / max;

      if (max == min) {
        h = 0; // achromatic
      } else {
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
      }

      return [
      Math.round(h * 360),
      PatternhsvService.percentRoundFn(s * 100),
      PatternhsvService.percentRoundFn(v * 100), a];
  }
  function rgb2hsv_tmp(r, g, b, a) {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    v = Math.max(rabs, gabs, babs),
    diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;
    if (diff == 0) {
      h = s = 0;
    } else {
      s = diff / v;
      rr = diffc(rabs);
      gg = diffc(gabs);
      bb = diffc(babs);

      if (rabs === v) {
        h = bb - gg;
      } else if (gabs === v) {
        h = (1 / 3) + rr - bb;
      } else if (babs === v) {
        h = (2 / 3) + gg - rr;
      }
      if (h < 0) {
        h += 1;
      } else if (h > 1) {
        h -= 1;
      }
    }
    return [
      Math.round(h * 360),
      percentRoundFn(s * 100),
      percentRoundFn(v * 100), a
    ];
  }
  function rgb2hsv_hsl(r, g, b, a) {
    r /= 255, g /= 255, b /= 255;

    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [r* 360,g* 100,b* 100,a]

  }
  function rgb2hsv2([r, g, b, a]) {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    v = Math.max(rabs, gabs, babs),
      diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;
    if (diff == 0) {
      h = s = 0;
    } else {
      s = diff / v;
      rr = diffc(rabs);
      gg = diffc(gabs);
      bb = diffc(babs);

      if (rabs === v) {
        h = bb - gg;
      } else if (gabs === v) {
        h = (1 / 3) + rr - bb;
      } else if (babs === v) {
        h = (2 / 3) + gg - rr;
      }
      if (h < 0) {
        h += 1;
      } else if (h > 1) {
        h -= 1;
      }
    }
    return [
      Math.round(h * 360),
      percentRoundFn(s * 100),
      percentRoundFn(v * 100), a
    ];
  }
  function getPixel(ctx, x, y) {
    let pixel = [];
    pixel = [...ctx.getImageData(x, y, 1, 1).data.values()];
    return pixel;
  }
  function compareHsv(hsv, hsv2, tol) {
    if (hsv[0] < hsv2[0] + tol[0] && hsv[0] > hsv2[0] - tol[0] &&
        hsv[1] < hsv2[1] + tol[1] && hsv[1] > hsv2[1] - tol[1] &&
        hsv[2] < hsv2[2] + tol[2] && hsv[2] > hsv2[2] - tol[2])
      return true;
    return false;
  }
  function hsvImage(ctx1, canvas1, ctx2, canvas2, hsv2, tol) {
    var imgData = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
    canvas2.width = canvas1.width;
    canvas2.height = canvas1.height;
    var d = imgData.data;
    for (var i = 0; i < d.length; i += 4) {
      let hsv = PatternhsvService.rgb2hsv(d[i], d[i + 1], d[i + 2], d[i + 3]);
      if (PatternhsvService.compareHsv(hsv, hsv2, tol)) {
        d[i] = d[i + 1] = d[i + 2] = 255;
      }
      else
        d[i] = d[i + 1] = d[i + 2] = 0;
    }
    ctx2.putImageData(imgData, 0, 0);
  }
  function rgbToHsvImage(ctx1, canvas1, ctx2, canvas2) {
    var imgData = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
    canvas2.width = canvas1.width;
    canvas2.height = canvas1.height;
    var d = imgData.data;
    for (var i = 0; i < d.length; i += 4) {
      let hsv = PatternhsvService.rgb2hsv(d[i], d[i + 1], d[i + 2], d[i + 3]);
      d[i+0]=hsv[0]*0.70;
      d[i+1]=hsv[1]*2.5;
      d[i+2]=hsv[2]*2.5;
      d[i+3]=hsv[3]*2.5;
    }
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    ctx2.putImageData(imgData, 0, 0);
  }
  function cropFromHsvNoFilter(ctx1, ctx2, x, y, w, h, middle, cellSize, hsv2, tol) {
    var imgData = null;
    if (middle)
      imgData = ctx1.getImageData(x - w / 2, y - h / 2, w, h);
    else
      imgData = ctx1.getImageData(x, y, w, h);
    let [dx, dy, x0, y0, x1, y1] = [0, 0, 0, 0, w, h];
    let sum = 0;
    var d = imgData.data;
    for (var i = 0; i < d.length; i += 4) {
        let hsv = PatternhsvService.rgb2hsv(d[i], d[i + 1], d[i + 2], d[i + 3]);
        d[i+0]=hsv[0]*0.70;
        d[i+1]=hsv[1]*2.5;
        d[i+2]=hsv[2]*2.5;
        d[i+3]=hsv[3]*2.5;

        sum++;
    }

    if (((x1 - x0) % cellSize) > 0) x1 = x1 + ((x1 - x0) % cellSize);
    if (((y1 - y0) % cellSize) > 0) y1 = y1 + ((y1 - y0) % cellSize);

    ctx2.clearRect(0, 0, 100, 100);
    ctx2.putImageData(imgData, 0, 0);
    return [imgData, x0, y0, x1, y1, sum];
  }
  function cropFromHsv(ctx1, ctx2, x, y, w, h, middle, cellSize, hsv2, tol) {
    var imgData = null;
    if (middle)
      imgData = ctx1.getImageData(x - w / 2, y - h / 2, w, h);
    else
      imgData = ctx1.getImageData(x, y, w, h);
    let [dx, dy, x0, y0, x1, y1] = [0, 0, -1, -1, w, h];
    let sum = 0;
    var d = imgData.data;
    for (var i = 0; i < d.length; i += 4) {
      let hsv = PatternhsvService.rgb2hsv(d[i], d[i + 1], d[i + 2], d[i + 3]);
      if (PatternhsvService.compareHsv(hsv, hsv2, tol)) {
        if (dx < x0 || x0 == -1) x0 = dx;
        if (dy < y0 || y0 == -1) y0 = dy;
        if (dx > x1) x1 = dx;
        if (dy > y1) y1 = dy;
        sum++;
      }
    }

    if (((x1 - x0) % cellSize) > 0) x1 = x1 + ((x1 - x0) % cellSize);
    if (((y1 - y0) % cellSize) > 0) y1 = y1 + ((y1 - y0) % cellSize);

    ctx2.clearRect(0, 0, 100, 100);
    ctx2.putImageData(imgData, 0, 0);
    return [imgData, x0, y0, x1, y1, sum];
  }
  function getPatternHsv(ctx, w, h, wb, hb, patternSizeOff, patternSize) {
    let blocks = []

    if (((w / wb) % 1) > 0) w = w - 1;
    if (((h / hb) % 1) > 0) h = h - 1;
    console.log();

    let dw = Math.round(w / wb);
    let dh = Math.round(h / hb);

    dw = dw % 2 == 1 ? dw - 1 : dw;
    dh = dh % 2 == 1 ? dh - 1 : dh;
    //console.log("dw,dh",dw,dh);
    var sums = 0;
    for (let iy = 0; iy < hb; iy++) {
      for (let ix = 0; ix < wb; ix++) {
        //let id = ctx.getImageData(ix,iy,dw,dh);
        const imgData = ctx.getImageData(ix * dw + dw / 2 - patternSizeOff, iy * dh + dh / 2 - patternSizeOff, patternSize, patternSize);
        var d = imgData.data;
        var sum = 0;
        var matrix = [];
        for (var i = 0; i < d.length; i += 4)
          matrix[i / 4] = PatternhsvService.rgb2hsv(d[i], d[i + 1], d[i + 2], d[i + 3]); sum++; sums++;

        blocks.push({
          x: ix * dw + dw / 2 - 1,
          y: iy * dh + dh / 2 - 1,
          m: matrix,
          s: sum
        });
      }
    }
    return [blocks, sums];
  }
  function pathPatternHsv(d, i, w, h, pattern) {
    _ss1 = pattern.patterns.length;
    _ox = pattern.patterns[0].x;
    _oy = pattern.patterns[0].y;
    _s1 = 0;
    for (ii = 0; ii < pattern.patterns.length; ii++) {
      _off1 = i + ((pattern.patterns[ii].x - _ox - 1) + (pattern.patterns[ii].y - _oy - 1) * w) * 4;//0
      _off2 = i + ((pattern.patterns[ii].x - _ox + 2) + (pattern.patterns[ii].y - _oy - 1) * w) * 4;//2
      _off3 = i + ((pattern.patterns[ii].x - _ox + 1) + (pattern.patterns[ii].y - _oy + 1) * w) * 4;//4
      _off4 = i + ((pattern.patterns[ii].x - _ox - 1) + (pattern.patterns[ii].y - _oy) + 2 * w) * 4;//5
      _off5 = i + ((pattern.patterns[ii].x - _ox + 2) + (pattern.patterns[ii].y - _oy) + 2 * w) * 4;//7

      //if (d[_off3] == pattern.patterns[ii].m[4]) _s1++;
      if (PatternhsvService.compareHsv(PatternhsvService.rgb2hsv(d[_off3], d[_off3 + 1], d[_off3 + 2], d[_off3 + 3]), pattern.patterns[ii].m[4], pattern.tol))
        _s1++;

    }
    if (_s1 > 0 && _s1 >= _ss1) return _s1;
    return -1;
  }
  function findPatternHsv(ctx, ctx1, canvas, pattern, first, crop) {
    ctx1.clearRect(0, 0, canvas.width, canvas.height);
    var id;
    if (crop == null) {
      //console.log("not is cropped");
      id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
      //console.log("is cropped");
      id = ctx.getImageData(crop[0], crop[1], crop[2], crop[3]);
    }
    var d = id.data;
    var jump = 0;
    var off = 0;
    let ww = -1;
    let hh = -1;
    if (crop == null) {
      ww = canvas.width;
      hh = canvas.height;
    } else {
      ww = crop[2];
      hh = crop[3];
    }
    var ofx = -1;
    var ofy = -1;
    var ow = -1;
    var oh = -1;
    var owm = -1;
    var ohm = -1;
    var finded = [];

    for (var i = 0; i < d.length; i += 4) {
      if (d[i] == 254) continue;
      if (first && ow > 0) { /*console.log("break");*/ break; }
      jump = PatternhsvService.pathPatternHsv(d, i, ww, hh, pattern)
      if (jump > 0) {
        //console.log("equal", jump, i);

        _ox = pattern.patterns[0].x;
        _oy = pattern.patterns[0].y;
        ofx = ((i / 4 - _ox) % ww);
        ofy = ((i / 4 - _ox) - ofx) / ww + 2;
        ow = pattern.pos[2];
        oh = pattern.pos[3];
        owm = Math.round(ow / 2);
        ohm = Math.round(oh / 2);
        for (ii = 2; ii < pattern.pos[3] + 2; ii++) {
          for (iii = 0; iii < pattern.pos[2]; iii++) {
            off = i + ((iii - _ox) + (ii - _oy) * ww) * 4;
            d[off] = 254;
          }
        }
      }
    }
    for (var i = 0; i < d.length; i += 4)
      if (d[i] != 254) {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
        d[i + 3] = 255;
      }
    console.log("ok");
    if (crop == null) {
      //ctx1.putImageData(id, 0, 0);
      if (ofx > 0){
        id = ctx.getImageData(ofx, ofy, ow, oh);
        ctx1.putImageData(id, ofx, ofy);
      }
      return [ofx, ofy, ow, oh, owm, ohm];
    } else {
      //ctx1.putImageData(id, crop[0], crop[1]);
      if (ofx == -1)
        return [ofx, ofy, ow, oh, owm, ohm];
      else{
        id = ctx.getImageData(ofx, ofy, ow, oh);
        ctx1.putImageData(id, ofx, ofy);
        /*ctx1.lineWidth = '4';
        ctx1.strokeStyle = 'green';
        ctx1.beginPath();
        ctx1.rect(ofx, ofy, ow, oh);
        ctx1.stroke();*/
        return [crop[0] + ofx, crop[1] + ofy, ow, oh, owm, ohm];
      }
    }
  }
  function findPatternHsv_old(ctx, ctx1, canvas, pattern, first, crop) {
    ctx1.clearRect(0, 0, canvas.width, canvas.height);
    var id;
    if (crop == null) {
      //console.log("not is cropped");
      id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
      //console.log("is cropped");
      id = ctx.getImageData(crop[0], crop[1], crop[2], crop[3]);
    }
    var d = id.data;
    var jump = 0;
    var off = 0;
    let ww = -1;
    let hh = -1;
    if (crop == null) {
      ww = canvas.width;
      hh = canvas.height;
    } else {
      ww = crop[2];
      hh = crop[3];
    }
    var ofx = -1;
    var ofy = -1;
    var ow = -1;
    var oh = -1;
    var owm = -1;
    var ohm = -1;
    var finded = [];

    for (var i = 0; i < d.length; i += 4) {
      if (d[i] == 254) continue;
      if (first && ow > 0) { /*console.log("break");*/ break; }
      jump = PatternhsvService.pathPatternHsv(d, i, ww, hh, pattern)
      if (jump > 0) {
        //console.log("equal", jump, i);

        _ox = pattern.patterns[0].x;
        _oy = pattern.patterns[0].y;
        ofx = ((i / 4 - _ox) % ww);
        ofy = ((i / 4 - _ox) - ofx) / ww + 2;
        ow = pattern.pos[2];
        oh = pattern.pos[3];
        owm = Math.round(ow / 2);
        ohm = Math.round(oh / 2);
        for (ii = 2; ii < pattern.pos[3] + 2; ii++) {
          for (iii = 0; iii < pattern.pos[2]; iii++) {
            off = i + ((iii - _ox) + (ii - _oy) * ww) * 4;
            d[off] = 254;
          }
        }
      }
    }
    for (var i = 0; i < d.length; i += 4)
      if (d[i] != 254) {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
      }
    console.log("ok");
    if (crop == null) {
      ctx1.putImageData(id, 0, 0);
      return [ofx, ofy, ow, oh, owm, ohm]
    } else {
      ctx1.putImageData(id, crop[0], crop[1]);
      if (ofx == -1)
        return [ofx, ofy, ow, oh, owm, ohm]
      else
        return [crop[0] + ofx, crop[1] + ofy, ow, oh, owm, ohm]
    }
  }
  /* COUNT ROW functionS*/
  function countRow(ctx, hsv2, tol, x, y, crop) {
    let pattern = { type: "crow", max: 0 };
    let w = crop[2];
    let h = crop[3];

    let imgData = ctx.getImageData(crop[0], crop[1], crop[2], crop[3]);
    let d = imgData.data;
    let x0 = 0;
    let y0 = 0;
    let sum = 0;
    //console.log("x,y",x,y);
    //console.log("crop",crop);
    for (var i = 0; i < d.length; i += 4) {
      x0 = ((i / 4) % w) + 1 + crop[0];
      y0 = ((i / 4) - ((i / 4) % w)) / w + 1 + crop[1];
      if (y == y0) {
        let hsv = PatternhsvService.rgb2hsv(d[i], d[i + 1], d[i + 2], d[i + 3]);
        if (PatternhsvService.compareHsv(hsv, hsv2, tol))
          sum++;
      }
    }
    pattern.max = sum;
    pattern['rectCrop'] = crop;
    pattern['hsv'] = hsv2;
    pattern['tol'] = tol;
    pattern['x'] = x;
    pattern['y'] = y;
    return [pattern];
  }

  function cropFromFast(ctx1, ctx2, x, y, w, h, middle) {
    var imgData = null;
    if (middle)
      imgData = ctx1.getImageData(x - w / 2, y - h / 2, w, h);
    else
      imgData = ctx1.getImageData(x, y, w, h);
    let [dx, dy, x0, y0, x1, y1] = [0, 0, -1, -1, w, h];
    let sum = 0;
    ctx2.clearRect(0, 0, 100, 100);
    ctx2.putImageData(imgData, 0, 0);
    return [imgData, x0, y0, x1, y1, sum];
  }
  function findPatternCrow(ctx, pattern) {

    let [hsv2, tol, x, y, crop] = [pattern.hsv, pattern.tol, pattern.x, pattern.y, pattern.rectCrop]

    let w = crop[2];
    let h = crop[3];
    //console.log("hsv2,tol,x,y,crop",[hsv2,tol,x,y,crop])
    let imgData = ctx.getImageData(crop[0], crop[1], crop[2], crop[3]);
    let d = imgData.data;
    let x0 = 0;
    let y0 = 0;
    let sum = 0;
    for (var i = 0; i < d.length; i += 4) {
      x0 = ((i / 4) % w) + 1 + crop[0];
      y0 = ((i / 4) - ((i / 4) % w)) / w + 1 + crop[1];
      if (y == y0) {
        let hsv = PatternhsvService.rgb2hsv(d[i], d[i + 1], d[i + 2], d[i + 3]);
        if (PatternhsvService.compareHsv(hsv, hsv2, tol))
          sum++;
      }
    }

    return [Math.round((sum / pattern.max) * 100), sum];
  }

  module.exports = {findPatternCrow,cropFromFast,countRow,findPatternHsv,getPatternHsv,cropFromHsv,cropFromHsvNoFilter,rgbToHsvImage,hsvImage,compareHsv,getPixel,rgb2hsv2,rgb2hsv_hsl,rgb2hsv};