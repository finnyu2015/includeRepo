var demp = {}; // $Id: demtMobileApp.js,v 1.1 2016/03/02 09:09:29 i20496 Exp $
demp.buildWorkspace = function (workspaceId, iconInRows, apps) {
    function buildApp(app) { 
        var margin=3;
        if($.mobile.window.width()>400) {
            margin=8;
        }
        var tmpl = "<div id='${appInfoId}'><span class='ui-li-count ui-btn-corner-all dezAppBadgeCount' id='${appInfoId}-count'>${count}</span><a id='${appInfoId}-a' href='${appInfoUrl}' rel='external' data-role='button' data-mini='true' style='margin:"+margin+"px;' data-transition='pop'><img id='${appInfoId}-img' src='${appInfoImg}' class='portal-icon'></a><div style='text-align:center;font-size: 0.8em' id='${appInfoId}-content'>${appTitle}</div></div>";
        for (var name in app) {
            var ptn = new RegExp("\\$\\{" + name + "\\}", "g");
            tmpl = tmpl.replace(ptn, app[name]);
        }
        return tmpl.replace(/<span .+>\$\{count\}<\/span>/, '').replace(/\/erp\//g, '../../');
    }

    var codes = ['a', 'a', 'b', 'c', 'd','e'],
        appLen = apps.length,
        wrapcode = codes[iconInRows - 1],
        childHtml = [],
        rowLen = appLen / iconInRows;

    for (var i = 0; i < rowLen; i++) {
        childHtml.push("<div class=\"ui-grid-" + wrapcode + "\">");
        for (var j = 0; j < iconInRows; j++) {
            var pos = i * iconInRows + j;
            if (pos >= appLen) {
                break;
            }
            childHtml.push("<div class=\"ui-block-" + codes[j+1] + "\">");
            childHtml.push(buildApp(apps[pos]));
            childHtml.push("</div>");
        }
        childHtml.push("</div>");
    }
    return "<div id='wsp-" + workspaceId + "' class='workspace'>" + childHtml.join("") + "</div>";
}
demp.recoverPortal = function (rootEleId, navId) {
    var portalCache = demp.portalMgr.getCache(),
        portalHtml = portalCache.portalHtml ,
        navLiHtml = portalCache.navLiHtml,
        workspaceTitles = portalCache.workspaceTitles;
    if (portalHtml && navLiHtml) {
        demp.workspaceTitles = workspaceTitles.split(',');
        document.getElementById(rootEleId).innerHTML = portalHtml;
        document.getElementById(navId).innerHTML = navLiHtml;
        demp.initSwipe();
        $('#homescreen').trigger('create');
        dem.unmask();
        return true;
    }
    return false;
}

demp.buildPortal = function (rootEleId, navId, workspaces, iconInRows) {
    var htmls = [], workspaceTitles = [], navLi = [];
    for (var i = 0; i < workspaces.length; i++) {
        if (workspaces[i].apps) {
            htmls.push(demp.buildWorkspace(workspaces[i].workspaceId, iconInRows, workspaces[i].apps));
            workspaceTitles[i] = workspaces[i].workspaceName;
            var clz = i == 0 ? 'on' : ' ';
            navLi[i] = "<li class='" + clz + "'></li>";
        }
    }
    demp.workspaceTitles = workspaceTitles;
    portalHtml = htmls.join('');
    navLiHtml = navLi.join('');
    document.getElementById(rootEleId).innerHTML = portalHtml;
    document.getElementById(navId).innerHTML = navLiHtml;
    demp.portalMgr.cache(portalHtml, navLiHtml, workspaceTitles.join(','));
}

demp.loadLoginData = function () {
    return {
        'UserId': dem.readStore('userId'),
        'hostUrl': demtcfg.loginHost,
        'CompId': dem.readStore('CompId'),
        'machineCode': dem.readStore('machineCode')
    }
}
demp.getLoginData = function () {
    return  {
        'UserId': $("#uid").val(),
        'Passwd': $("#pwd").val(),
        'hostUrl': demtcfg.loginHost,
        'CompId': $("#CompId").val(),
        'machineCode': $("#machineCode").val()
    };
}
var escapeCounter=0 ;
demp.submitForm = function () {
    dem.changeMaskText("驗證裝置中..");

    // 判斷是否使用手機瀏覽器開啟remote debug 模式
    // 若URL queryString中debug 為true,寫入localstorage 紀錄isBrowser=true
    if (dem.getQueryString("debug")) {
        dem.saveStore("isBrowser", true);
    }

    //若為debug 模式則預設通過檢核
    var uuid = dem.getUUID() ;
    if (uuid) {
        loginfrm.machineCode.value = uuid ;

        //檢查裝置狀態 確認狀態已啟用才submit至portal
        var postData = {
            'UserId': $("#uid").val(),
            'Passwd': $("#pwd").val(),
            'hostUrl': demtcfg.loginHost,
            'machineCode': loginfrm.machineCode.value
        };
        dem.eventbus('demcLogin.checkStatus', postData, function (resp) {
            dem.saveStore('machineCode', loginfrm.machineCode.value);
            var info = resp.i;
            if (info.msg !== "") {
                dem.alert(msg) ;
            } else if (info.toPage) {
                dem.changeMaskText("轉至首頁..");
                dem.toPage('#demjPortal', 'flip');
            }
        });
    } else {
        escapeCounter++;
        if (escapeCounter < 20) {
            setTimeout(dem.submitForm, 10);
        } else {
            dem.alert("device is not ready!");
        }
    }
}
demp.initLoginData = function () {
    $('#CompId').val(dem.readStore('CompId')).selectmenu("refresh");
    $('#uid').val(dem.readStore('userId'));
}
demp.loadPortal = function () {
    dem.changeMaskText('載入portal..');
    if (demp.recoverPortal('homescreen', 'navWorkspace')) {
        return;
    }
    dem.eventbus('demcPortal.loadWorkspaces', dem.loadLoginData(), function (resp) {
        var workspaces = resp.i.portalInfo,
            winWidth=$.mobile.window.width(),
            icons = 3 ;
        if (winWidth>480 && winWidth<=780) {
            icons=4;
        }else if (winWidth>780) {
            icons=5 ;
        }
        demp.buildPortal('homescreen', 'navWorkspace', workspaces, icons);
        demp.initSwipe();
        $('#homescreen').trigger('create');
    });
}

demp.logout = function () {
	$.post("/erp/dem/jsp/demjsignout.jsp", function(data) {
		location.href = '/erp/html/dem/demhAppRizhaoQS.html';
		dem.saveStore('Passwd', "");
	    $('#pwd').val('');
		demp.portalMgr.reset();
	    dem.saveStore('rememberMe', 'off');
	    $('#demjLogin').on('pageshow', function () {
	        $('#rememberMe').val('off').slider('refresh');
	    })
	});
};

demp.login = function () {
    if ($.trim($("#CompId").val()).length == 0) {
        dem.alert("請選公司");
        return;
    }
    if ($.trim($("#pwd").val()).length == 0) {
        dem.alert("請填寫密碼");
        return;
    }
    if ($.trim($("#uid").val()).length == 0) {
        dem.alert("請填寫帳號");
        return;
    }
    dem.mask("驗證身份中..");
    demp.portalMgr.reset();
    var postData = dem.getLoginData();
    dem.erp.loginToErp(postData.hostUrl, postData, demp.submitForm);
}

demp.portalMgr = {
    cache: function (portalHtml, navLiHtml, workspaceTitles) {
        dem.saveStore('portalHtml', portalHtml);
        dem.saveStore('navLiHtml', navLiHtml);
        dem.saveStore('workspaceTitles', workspaceTitles);
    },
    reset: function () {
        dem.saveStore('portalHtml', "");
        dem.saveStore('navLiHtml', "");
        dem.saveStore('workspaceTitles', "");
        dem.saveStore('workspaceSlidePos', "0");				
    },
    getCache: function () {
        return {
            portalHtml: dem.readStore('portalHtml'),
            navLiHtml: dem.readStore('navLiHtml'),
            workspaceTitles: dem.readStore('workspaceTitles')
        };
    }
}
    

//dem.workspaceTitles=['首頁','T28','財務'] ;
demp.initSwipe = function () {
    var bullets = document.getElementById('navWorkspace').getElementsByTagName('li'),
        slidePos = dem.readStore('workspaceSlidePos') || 0;

    function switchOnNavLi(pos) {
        var i = bullets.length;
				if(pos>=i){ // in case pos outbound cause reading from another userId cache
					pos=0 ;
				}
        while (i--) {
            bullets[i].className = ' ';
        }
        bullets[pos].className = 'on';
    }

    var swiper = Swipe(document.getElementById('homescreen-swipe'), {
        startSlide: slidePos,
        continuous: false,
        callback: function (pos) {
            switchOnNavLi(pos);
            document.getElementById('dem-title').innerText = demp.workspaceTitles[pos];
            dem.saveStore('workspaceSlidePos', pos);
        }
    });
    document.getElementById('dem-title').innerText = demp.workspaceTitles[slidePos];
    switchOnNavLi(slidePos);
    return swiper;
}
