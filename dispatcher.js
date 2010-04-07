// @require Auger.Event
window.Auger || (window.Auger = {});
Auger.Dispatcher = {_actions: []};
Auger.Dispatcher._onhashchange = function(e){ 	// gets detached (avoid unnecessary closure)
	if(!e)e=window.event;
	var a=Auger.Dispatcher._actions;
	var h=Auger.Dispatcher.getHash();
	for(var i=0;i<a.length;++i){
		var v = null, t = a[i][1];
		switch(a[i][0]){
			case 0: v=true; break;
			case 1: v=(h.indexOf(t)==0?h.split(t.charAt(t.length-1)):null); break;
			case 2: v=h.match(t); break;
			case 3: v=t(h); break;
		}
		if(v) a[i][2].call(e, h, v); 	// call as a method on the event (for consistency)
	}
};
// prefix string, regex, or boolean function (allows multiple "apps" on the same page)
Auger.Dispatcher._dispatch_types = [null, 'string', RegExp, Function];
Auger.Dispatcher.dispatch = function(c,f){
	var t = this._dispatch_types, d = null;
	if(!f)
		d = [0,null,c];
	else if(typeof(c) == 'string')
		d = [1,c,f];
	else
		for(var i=2; i<t.length; ++i)
			if(c instanceof t[i])
				d = [i,c,f];
	if( d )
		this._actions.push(d);
	else
		throw("Unknown argument: " + c);
	this._lastHash = this.getHash(); 	// requires the page to load the initial hash
	if( this._actions.length == 1) 	// only add it the first time since we roll through all the possibilities
		Auger.Event.add(window, 'hashchange', this._onhashchange);
};
Auger.Dispatcher.getHash = function(){
	//var h = location.hash; return h ? h.replace(/^#+/,'') : location.href.replace(/^[^#]*#/,'');
	return location.hash.replace(/^#+/,'');
};
Auger.Dispatcher.setHash = function(h){
	if( h.charAt(0) != '#' ) h = '#' + h;
	var f;
	if((f = this._iframe)) f.src = f.src.replace(/#.*$/, h);
	location.hash = h;
};
