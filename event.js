window.Auger || (window.Auger = {});
Auger.Event = {};

// Event.add(element, event, function)

if(document.addEventListener){
	Auger.Event.add    = function(l, t, f){ l.addEventListener(t, f, false); };
	Auger.Event.remove = function(l, t, f){ l.removeEventListener(t, f, false); };
}
