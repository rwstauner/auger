window.Auger || (window.Auger = {});
Auger.Event = {};

// Event.add(element, event, function)

if(document.addEventListener){
	Auger.Event.add    = function(l, t, f){ if(!this.prepare(t, l, f)) return; l.addEventListener(t, f, false); };
	Auger.Event.remove = function(l, t, f){ l.removeEventListener(t, f, false); };
	Auger.Event.send   = function(l, t){ var e=document.createEvent('Events'); e.initEvent(t,true,false); l.dispatchEvent(e); };
}
else if(document.attachEvent){ 	// IE [5+]
	Auger.Event._isIE = true;
	Auger.Event.add = function(l, t, f) {
		var a = this;
		if(!a.prepare(t, l, f)) return;
		if(a._get(l, t, f) != -1) return; 	// ignore duplicates
		var ff = function(e) {
			if (!e) e = window.event;
			// emulate DOM events
			e.target = e.srcElement,
			e.currentTarget = l,
			e.relatedTarget = (e.fromElement||e.toElement),
			e.eventPhase = (e.srcElement==l?2:3),
			e.charCode = e.keyCode,
			e.preventDefault = a._d_preventDefault,
			e.stopPropagation = a._d_stopPropagation;
			// invoke function as method on element for correct value of 'this'
			f.call(l, e);
		};
		l.attachEvent('on' + t, ff); 	// save wrapper as event handler

		var h = [l,t,f,ff]; 			// remember these values so we can detach later
		var w = a.elementWindow(l);

		var u = a._uid();
		var nw = a._cache_w;
		var nl = a._cache_l;
		var un = false;
		if(un=!w[nw]) w[nw]={};
		w[nw][u] = h; 	// store on window to be removed on window unload
		if(!l[nl]) l[nl] = [];
		l[nl].push(u); 	// store uid on element
		if(un) 			// explicitly remove handlers to try to avoid memory leaks
			w.attachEvent('onunload', a._d_onWindowUnload);
	};
	Auger.Event.remove = function(l, t, f) {
		var a = this;
		var i = a._get(l, t, f);
		if(i>=0){
			var nl = a._cache_l;
			var wn = a.elementWindow(l)[a._cache_w];
			var hid = l[nl][i]; 	// get id
			var h = wn[hid]; 	// find on window
			l.detachEvent('on' + t, h[3]);
			l[nl].splice(i, 1); 	// pop
			delete wn[hid];
		}
	};
	Auger.Event.send = function(l, t){ var e = document.createEventObject(); l.fireEvent('on'+t,e); }
	Auger.Event._get = function(l, t, f) {
		var nl = this._cache_l, nw = this._cache_w;
		var hs = l[nl];
		if(hs && hs.length){
			var wn = this.elementWindow(l)[nw];
			for(var i = hs.length-1; i>=0; i--){ 	// LIFO
				var h = wn[hs[i]];
				if(h[1] == t && h[2] == f) 		// same type and same function
					return i;
			}
		}
		return -1; 	// index (not found)
	};
	// we need separate cache objects in case the element is a window
	Auger.Event._cache_w = ' Auger.Event._cache_w'; 	// window
	Auger.Event._cache_l = ' Auger.Event._cache_l'; 	// element
	Auger.Event._uidc = 0;
	Auger.Event._uid = function(){ return 'ae' + this._uidc++; };
	Auger.Event.elementWindow = function(l){ return (l.document || l).parentWindow; };
	// declare these here to avoid unnecessary closures (we are doing this only for IE)
	// These will be detached so 'this' will be something else (and Auger.Event must be fully qualified)
	Auger.Event._d_preventDefault  = function(){this.returnValue = false;}; // this = event
	Auger.Event._d_stopPropagation = function(){this.cancelBubble = true;};
	Auger.Event._d_onWindowUnload = function(){
		var wn = this[Auger.Event._cache_w]; 	// this = window being unloaded
		for(var u in wn){
			var h = wn[u];
			h[0].detachEvent('on' + h[1], h[3]);
			delete wn[u];
		}
	}
}
//else
//	l['on'+e] = f;
//	Auger.Event.send = function(l, t){ if(ot in l && typeof(l[ot]) == 'function') l[ot](); }
Auger.Event._prepared = {};
Auger.Event._cached = {};
Auger.Event.prepare = function(t, l, f){
	var a = this;
	if(!(t in a._prepared)){
		a._prepared[t] = true;
		a._cached[t] = [];
		if(a.synthesize[t]) 		// if an event synthesizer exists call it
			a._prepared[t] = a.synthesize[t].init(l, f); // otherwise just ignore (and don't call prepare again)
	}
	if(!a._prepared[t])
		a._cached[t].push([l,f]);
	return a._prepared[t];
};
Auger.Event.synthesize = {};
// only define method for synthesizing if the browser doesn't natively support it
if(!('onhashchange' in window) || (window.attachEvent && (document.documentMode||0) < 8)){ // only ie8 in ie8 mode supports it
	Auger.Event.synthesize.hashchange = {_iframe: Auger.Event._isIE, _timer: null};
	Auger.Event.synthesize.hashchange.init = function(){
		//throw 'not implemented yet';
		var _ = Auger.Event.synthesize.hashchange;
		if( _._iframe ){
			var frame = document.createElement('iframe');
			frame.setAttribute('src', 'javascript:"<html></html>"');
			var s = frame.style;
				s.position = 'absolute';
				s.top = s.left = '-1px';
				s.width = s.height = '1px';
				s.display = 'none';
			document.body.appendChild(frame);
			_._iframe = frame.contentWindow;
			_._iframeUpdate(_._hash());
		}
		_._start();
		return !_._iframe; 	// return false to indicate that this custom even is not supported
	};
	Auger.Event.synthesize.hashchange._start = function(h){
		var _ = this;
		if(!_._timer){ 	// ignore if timer already set
			_._last = h||_._hash();
			_._timer = setInterval(_._poll,250);
		}
	};
	Auger.Event.synthesize.hashchange._stop  = function(){ clearInterval(this._timer); this._timer = null; };
	Auger.Event.synthesize.hashchange._hash  = function(u){ 	// sending n sets hash
		return (u||location.href).replace(/^[^#]*#?(.*)$/,'$1');
	};
	if( Auger.Event.synthesize.hashchange._iframe ){
		Auger.Event.synthesize.hashchange._iframeHash  = function(){
			return this._hash(this._iframe.location.href);
		};
		Auger.Event.synthesize.hashchange._iframeUpdate = function(h){
			var fr = this._iframe;
			fr.document.open().close(); 	// reset the iframe so IE will add a history entry
			fr.location.hash = '#' + h;
			//if((f = this._iframe)) f.src = f.src.replace(/#.*$/, h);
		};
	}
	Auger.Event.synthesize.hashchange._poll = function(){
		var a = Auger.Event, et = 'hashchange';
		var _ = a.synthesize[et];
		var b = false, h = _._hash(), f = _._iframe, ac = a._cached[et];
		var fh = f ? _._iframeHash() : h;
		if(h !== _._last){
			b = true;
			if(f && h !== fh) _._iframeUpdate(h);
		}else if(f && fh !== _._last){
			b = true;
			location.href = location.href.replace(/#.*$/,'#'+fh);
		}
		if(b){
			_._stop(); 									// pause polling until after events
			if(f) 										// IE doesn't allow custom events
				for(var i=0;i<ac.length;++i) 			// so roll through the cache
					ac[i][1].call(ac[i][0]);
			else
				Auger.Event.send(window, et); // synchronous (wait)
			_._start(_._last=h); 						// resume polling
		}
	};
}
