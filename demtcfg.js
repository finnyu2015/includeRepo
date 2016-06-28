var demtcfg = {} ;
//demtcfg.bridge = "false" ;
 demtcfg.bridge = "true" ;

demtcfg.isBridge=function(){
	return demtcfg.bridge==='true' ;
}

demtcfg.zipcode = (demtcfg.bridge !== "false") ;
demtcfg.portalHref="icscApp.html#demjPortal";


//demtcfg.loginHost =  window.location.pathname.split("/")[1];
demtcfg.erpHost = "";
demtcfg.erpHostTest = "http://10.1.198.242";
demtcfg.lite = true ;

//demtcfg.erpHost =  "http://groupeipt.csc.com.tw";
