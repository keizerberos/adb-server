
function bwImage(ctx1, canvas1, ctx2, canvas2, umbral) {
    var imgData = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
    canvas2.width = canvas1.width;
    canvas2.height = canvas1.height;
    var d = imgData.data;
    for (var i = 0; i < d.length; i += 4) {
        var med = (d[i] + d[i + 1] + d[i + 2]) / 3;
        d[i] = d[i + 1] = d[i + 2] = med > umbral ? 0 : 255;
    }
    // redraw the new computed image
    ctx2.putImageData(imgData, 0, 0);
}
function pathPattern(d, i, w, h, pattern, cellsize) {
    _ss1 = pattern.patterns.length;
    _ox = pattern.patterns[0].x;
    _oy = pattern.patterns[0].y;
    _s1 = 0;
    for (ii = 0; ii < pattern.patterns.length; ii++) {
        //for(iii = 0 ; iii < pattern.patterns[ii].m.length; iii++){
        _off1 = i + ((pattern.patterns[ii].x - _ox - 1) + (pattern.patterns[ii].y - _oy - 1) * w) * 4;//0
        _off2 = i + ((pattern.patterns[ii].x - _ox + 2) + (pattern.patterns[ii].y - _oy - 1) * w) * 4;//2
        _off3 = i + ((pattern.patterns[ii].x - _ox + 1) + (pattern.patterns[ii].y - _oy + 1) * w) * 4;//4
        _off4 = i + ((pattern.patterns[ii].x - _ox - 1) + (pattern.patterns[ii].y - _oy) + 2 * w) * 4;//5
        _off5 = i + ((pattern.patterns[ii].x - _ox + 2) + (pattern.patterns[ii].y - _oy) + 2 * w) * 4;//7
        //if (d[_off1] == pattern.patterns[ii].m[iii]) _s1++;
        if (d[_off3] == pattern.patterns[ii].m[4]
            /*		 && d[_off1] == pattern.patterns[ii].m[0] 
                     && d[_off2] == pattern.patterns[ii].m[2] 
                     && d[_off4] == pattern.patterns[ii].m[5] 
                     && d[_off5] == pattern.patterns[ii].m[7] */
            //d[_off3] == pattern.patterns[ii].m[2] && */
            //d[_off4] == pattern.patterns[ii].m[3] 
        ) _s1++;
        //else return -1;

        //_ss1++;
        //}			
    }
    //if (_s1 >0) console.log("equalp",pattern);
    //if (_s1 > 0 && _s1 == _ss1) return 1;
    /*for icons*/
    if (_s1 > 0 && _s1 >= _ss1) return _s1;
    /*for others*/
    //if (_s1 > 0 && _s1+pattern.cellSize >= _ss1 ) return _s1;
    return -1;
}
function findPattern(ctx, ctx1, canvas, pattern, first, crop) {

    ctx1.clearRect(0, 0, canvas.width, canvas.height);
    var id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (crop == null) {
        id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
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
        if (first && ow > 0) { console.log("break"); break; }
        jump = pathPattern(d, i, ww, hh, pattern)
        if (jump > 0) {
            console.log("equal", jump, i);

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
        }/*else if (d[i]!=254){				
                d[i] = 0;
                d[i+1] = 0;
                d[i+2] = 0;
            }*/
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

module.exports = {bwImage,findPattern,pathPattern};