(function() {
  var ie_lt8 = /MSIE \d/.test(navigator.userAgent) &&
    (document.documentMode == null || document.documentMode < 8);

  var Pos = CodeMirror.Pos;

  var matching = {"(": ")>", ")": "(<", "[": "]>", "]": "[<", "{": "}>", "}": "{<"};
  function findMatchingBracket(cm) {
    var maxScanLen = cm.state._matchBrackets.maxScanLineLength || 10000;

    var cur = cm.getCursor(), line = cm.getLineHandle(cur.line), pos = cur.ch - 1;
    var match = (pos >= 0 && matching[line.text.charAt(pos)]) || matching[line.text.charAt(++pos)];
    if (!match) return null;
    var forward = match.charAt(1) == ">", d = forward ? 1 : -1;
    var style = cm.getTokenAt(Pos(cur.line, pos + 1)).type;

    var stack = [line.text.charAt(pos)], re = /[(){}[\]]/;
    function scan(line, lineNo, start) {
      if (!line.text) return;
      var pos = forward ? 0 : line.text.length - 1, end = forward ? line.text.length : -1;
      if (line.text.length > maxScanLen) return null;
      var checkTokenStyles = line.text.length < 1000;
      if (start != null) pos = start + d;
      for (; pos != end; pos += d) {
        var ch = line.text.charAt(pos);
        if (re.test(ch) && (!checkTokenStyles || cm.getTokenAt(Pos(lineNo, pos + 1)).type == style)) {
          var match = matching[ch];
          if (match.charAt(1) == ">" == forward) stack.push(ch);
          else if (stack.pop() != match.charAt(0)) return {pos: pos, match: false};
          else if (!stack.length) return {pos: pos, match: true};
        }
      }
    }
    for (var i = cur.line, found, e = forward ? Math.min(i + 100, cm.lineCount()) : Math.max(-1, i - 100); i != e; i+=d) {
      if (i == cur.line) found = scan(line, i, pos);
      else found = scan(cm.getLineHandle(i), i);
      if (found) break;
    }
    return {from: Pos(cur.line, pos), to: found && Pos(i, found.pos), match: found && found.match};
  }

  function matchBrackets(cm, autoclear) {
    // Disable brace matching in long lines, since it'll cause hugely slow updates
    var maxHighlightLen = cm.state._matchBrackets.maxHighlightLineLength || 1000;
    var found = findMatchingBracket(cm);
    if (!found || cm.getLine(found.from.line).length > maxHighlightLen ||
       found.to && cm.getLine(found.to.line).length > maxHighlightLen)
      return;

    var style = found.match ? "CodeMirror-matchingbracket" : "CodeMirror-nonmatchingbracket";
    var one = cm.markText(found.from, Pos(found.from.line, found.from.ch + 1), {className: style});
    var two = found.to && cm.markText(found.to, Pos(found.to.line, found.to.ch + 1), {className: style});
    // Kludge to work around the IE bug from issue #1193, where text
    // input stops going to the textare whever this fires.
    if (ie_lt8 && cm.state.focused) cm.display.input.focus();
    var clear = function() {
      cm.operation(function() { one.clear(); two && two.clear(); });
    };
    if (autoclear) setTimeout(clear, 800);
    else return clear;
  }

  var currentlyHighlighted = null;
  function doMatchBrackets(cm) {
    cm.operation(function() {
      if (currentlyHighlighted) {currentlyHighlighted(); currentlyHighlighted = null;}
      if (!cm.somethingSelected()) currentlyHighlighted = matchBrackets(cm, false);
    });
  }

  CodeMirror.defineOption("matchBrackets", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init)
      cm.off("cursorActivity", doMatchBrackets);
    if (val) {
      cm.state._matchBrackets = typeof val == "object" ? val : {};
      cm.on("cursorActivity", doMatchBrackets);
    }
  });

  CodeMirror.defineExtension("matchBrackets", function() {matchBrackets(this, true);});
  CodeMirror.defineExtension("findMatchingBracket", function(){return findMatchingBracket(this);});
})();

(function(){function c(b){"activeLine"in b.state&&(b.removeLineClass(b.state.activeLine,"wrap",e),b.removeLineClass(b.state.activeLine,"background",a))}function d(b){var d=b.getLineHandle(b.getCursor().line);b.state.activeLine!=d&&(c(b),b.addLineClass(d,"wrap",e),b.addLineClass(d,"background",a),b.state.activeLine=d)}var e="CodeMirror-activeline",a="CodeMirror-activeline-background";CodeMirror.defineOption("styleActiveLine",!1,function(a,e,h){h=h&&h!=CodeMirror.Init;e&&!h?(d(a),a.on("cursorActivity",
d)):!e&&h&&(a.off("cursorActivity",d),c(a),delete a.state.activeLine)})})();CodeMirror.overlayMode=CodeMirror.overlayParser=function(c,d,e){return{startState:function(){return{base:CodeMirror.startState(c),overlay:CodeMirror.startState(d),basePos:0,baseCur:null,overlayPos:0,overlayCur:null}},copyState:function(a){return{base:CodeMirror.copyState(c,a.base),overlay:CodeMirror.copyState(d,a.overlay),basePos:a.basePos,baseCur:null,overlayPos:a.overlayPos,overlayCur:null}},token:function(a,b){a.start==b.basePos&&(b.baseCur=c.token(a,b.base),b.basePos=a.pos);a.start==b.overlayPos&&
(a.pos=a.start,b.overlayCur=d.token(a,b.overlay),b.overlayPos=a.pos);a.pos=Math.min(b.basePos,b.overlayPos);a.eol()&&(b.basePos=b.overlayPos=0);return null==b.overlayCur?b.baseCur:null!=b.baseCur&&e?b.baseCur+" "+b.overlayCur:b.overlayCur},indent:c.indent&&function(a,b){return c.indent(a.base,b)},electricChars:c.electricChars,innerMode:function(a){return{state:a.base,mode:c}},blankLine:function(a){c.blankLine&&c.blankLine(a.base);d.blankLine&&d.blankLine(a.overlay)}}};(function(){function c(d,c,a){function b(a){var b=g(d,c);if(!b||b.to.line-b.from.line<h)return null;for(var f=d.findMarksAt(b.from),l=0;l<f.length;++l)if(f[l].__isFold){if(!a)return null;b.cleared=!0;f[l].clear()}return b}var g=a.call?a:a&&a.rangeFinder;if(g){"number"==typeof c&&(c=CodeMirror.Pos(c,0));var h=a&&a.minFoldSize||0,f=b(!0);if(a&&a.scanUp)for(;!f&&c.line>d.firstLine();)c=CodeMirror.Pos(c.line-1,0),f=b(!1);if(f&&!f.cleared){a=a&&a.widget||"\u2194";if("string"==typeof a){var l=document.createTextNode(a);
a=document.createElement("span");a.appendChild(l);a.className="CodeMirror-foldmarker"}CodeMirror.on(a,"mousedown",function(){m.clear()});var m=d.markText(f.from,f.to,{replacedWith:a,clearOnEnter:!0,__isFold:!0})}}}CodeMirror.newFoldFunction=function(d,e){return function(a,b){c(a,b,{rangeFinder:d,widget:e})}};CodeMirror.defineExtension("foldCode",function(d,e){c(this,d,e)});CodeMirror.combineRangeFinders=function(){var c=Array.prototype.slice.call(arguments,0);return function(e,a){for(var b=0;b<c.length;++b){var g=
c[b](e,a);if(g)return g}}}})();CodeMirror.braceRangeFinder=function(c,d){function e(e){for(var f=d.ch,g=0;;)if(f=b.lastIndexOf(e,f-1),-1==f){if(1==g)break;g=1;f=b.length}else{if(1==g&&f<d.ch)break;h=c.getTokenAt(CodeMirror.Pos(a,f+1)).type;if(!/^(comment|string)/.test(h))return f+1;f-=1}}var a=d.line,b=c.getLine(a),g,h,f="{",l="}";g=e("{");null==g&&(f="[",l="]",g=e("["));if(null!=g){var m=1,r=c.lastLine(),k,n,p=a;a:for(;p<=r;++p)for(var q=c.getLine(p),j=p==a?g:0;;){var s=q.indexOf(f,j),j=q.indexOf(l,j);0>s&&(s=q.length);0>j&&(j=
q.length);j=Math.min(s,j);if(j==q.length)break;if(c.getTokenAt(CodeMirror.Pos(p,j+1)).type==h)if(j==s)++m;else if(!--m){k=p;n=j;break a}++j}if(!(null==k||a==k&&n==g))return{from:CodeMirror.Pos(a,g),to:CodeMirror.Pos(k,n)}}};
CodeMirror.importRangeFinder=function(c,d){function e(a){if(a<c.firstLine()||a>c.lastLine())return null;var b=c.getTokenAt(CodeMirror.Pos(a,1));/\S/.test(b.string)||(b=c.getTokenAt(CodeMirror.Pos(a,b.end+1)));if("keyword"!=b.type||"import"!=b.string)return null;var d=a;for(a=Math.min(c.lastLine(),a+10);d<=a;++d){var e=c.getLine(d).indexOf(";");if(-1!=e)return{startCh:b.end,end:CodeMirror.Pos(d,e)}}}d=d.line;var a=e(d),b;if(!a||e(d-1)||(b=e(d-2))&&b.end.line==d-1)return null;for(b=a.end;;){var g=e(b.line+
1);if(null==g)break;b=g.end}return{from:c.clipPos(CodeMirror.Pos(d,a.startCh+1)),to:b}};CodeMirror.includeRangeFinder=function(c,d){function e(a){if(a<c.firstLine()||a>c.lastLine())return null;var b=c.getTokenAt(CodeMirror.Pos(a,1));/\S/.test(b.string)||(b=c.getTokenAt(CodeMirror.Pos(a,b.end+1)));if("meta"==b.type&&"#include"==b.string.slice(0,8))return b.start+8}d=d.line;var a=e(d);if(null==a||null!=e(d-1))return null;for(var b=d;null!=e(b+1);)++b;return{from:CodeMirror.Pos(d,a+1),to:c.clipPos(CodeMirror.Pos(b))}};CodeMirror.tagRangeFinder=function(){var c=RegExp("<(/?)([A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD-:.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*)","g");return function(d,e){function a(){if(!(h>=d.lastLine()))return f=
0,l=d.getLine(++h),!0}function b(){for(;;){var b=l.indexOf(">",f);if(-1==b)if(a())continue;else break;var c=l.lastIndexOf("/",b),c=-1<c&&/^\s*$/.test(l.slice(c+1,b));f=b+1;return c?"selfClose":"regular"}}function g(){for(;;){c.lastIndex=f;var b=c.exec(l);if(!b)if(a())continue;else break;f=b.index+b[0].length;return b}}for(var h=e.line,f=0,l=d.getLine(h),m=[],r;;){var k=g(),n;if(!k||h!=e.line||!(n=b()))return;if(!k[1]&&"selfClose"!=n){m.push(k[2]);r=f;break}}for(;;){var k=g(),p=h,q=f-(k?k[0].length:
0);if(!k||!(n=b()))break;if("selfClose"!=n)if(k[1]){for(var j=m.length-1;0<=j;--j)if(m[j]==k[2]){m.length=j;break}if(!m.length)return{from:CodeMirror.Pos(e.line,r),to:CodeMirror.Pos(p,q)}}else m.push(k[2])}}}();function isFullScreen(c){return/\bCodeMirror-fullscreen\b/.test(c.getWrapperElement().className)}function winHeight(){return window.innerHeight||(document.documentElement||document.body).clientHeight}
function setFullScreen(c,d){var e=c.getWrapperElement(),a=document.getElementById("actions");d?(e.className+=" CodeMirror-fullscreen",e.style.height=winHeight()+"px",document.documentElement.style.overflow="hidden",top.mainMenu.hideTreeFrame(),a.className+=" action-opacity"):(e.className=e.className.replace(" CodeMirror-fullscreen",""),e.style.height="",document.documentElement.style.overflow="",top.mainMenu.defaultTreeFrame(),a.className=a.className.replace(" action-opacity",""));c.refresh()}
CodeMirror.on(window,"resize",function(){var c=document.body.getElementsByClassName("CodeMirror-fullscreen")[0];c&&(c.CodeMirror.getWrapperElement().style.height=winHeight()+"px")});
