import{n as I}from"./index-e8e306c5.js";import{d as A,R as p,S as f,a6 as y,a2 as l,a4 as v,H as S,F as C,a7 as x,a3 as E,c as k,a8 as B,ab as F,ac as L,ak as T}from"./vue-f337fce5.js";import{_ as $}from"./_plugin-vue_export-helper-c27b6911.js";import"./naive-ui-5426aa23.js";import"./vueuse-motion-2f7a1d90.js";const N=A({name:"XhsShareLink",data(){return{postData:null,signatureData:null,currentImageIndex:0,totalImages:0,startX:0,currentX:0,startY:0,currentY:0,touchStartTime:0,touchMoveY:0,isDragging:!1,swipeThreshold:50,isTransitioning:!1,isVerticalScrolling:!1,currentIdentifier:null,urlHasIdentifier:!1,loading:!0,loadingProgress:0,loadingStage:"准备中...",error:"",errorColor:"red",nextButtonDisabled:!1,API_DOMAIN:window.location.origin+"/api",isWechatAndroid:!1,noteSharedByOthers:!1,douyinSchema:"",douyinSchemaLoading:!1,douyinSchemaError:"",douyinShared:!1,preferredSharePlatform:"xhs",showBothShareButtons:!0,isXhsUsed:!1,isDouyinUsed:!1,isPreview:!1,showDesktopModal:!1,qrCodeUrl:"",isDebug:!1,showPlatformDialog:!1,consoleLogs:[],originalConsole:{log:null,error:null,warn:null,info:null},debugLogExpanded:!0,jsonDepth:0,filterEnabled:!0,filteredLogCount:0,hideNoteContent:!1,showConfirmDialog:!1,confirmDialogTitle:"",confirmDialogMessage:"",confirmDialogCallback:null}},computed:{showShareButton(){if(!this.postData||this.isPreview||this.isXhsUsed||this.noteSharedByOthers)return!1;const e=this.getUrlParams(),t=(e==null?void 0:e.platform)||null;return t==="douyin"?!1:t==="xhs"||t===null||this.showBothShareButtons},showDouyinShareButton(){if(!this.postData||this.isPreview||this.isDouyinUsed||this.douyinShared||this.noteSharedByOthers)return!1;const e=this.getUrlParams(),t=(e==null?void 0:e.platform)||null;return t==="xhs"?!1:t==="douyin"||t===null||this.showBothShareButtons},showSharePageButton(){return!(!this.isPreview||!this.postData)},isNoteUsed(){if(!this.postData)return!1;const e=this.postData.isUsed!==void 0?this.postData.isUsed:this.postData.is_used!==void 0?this.postData.is_used:0;let t;return typeof e=="boolean"?t=e?1:0:typeof e=="string"?t=e.toLowerCase()==="true"?1:parseInt(e,10):t=e,t===1||e===!0}},mounted(){this.startLoadingAnimation(),this.initPage().then(()=>{this.showShareButton&&!this.isPreview&&setTimeout(()=>{this.loadXhsSDK()},2e3)}),window.addEventListener("scroll",this.handleScroll,{passive:!0}),this.$nextTick(()=>{this.setupButtonStyles()})},beforeUnmount(){window.removeEventListener("scroll",this.handleScroll),this.isDebug&&this.originalConsole.log&&(console.log=this.originalConsole.log,console.error=this.originalConsole.error,console.warn=this.originalConsole.warn,console.info=this.originalConsole.info)},methods:{setupConsoleCapture(){this.originalConsole={log:console.log,error:console.error,warn:console.warn,info:console.info},console.log=(...e)=>{this.originalConsole.log(...e),this.addConsoleLog("log",e)},console.error=(...e)=>{this.originalConsole.error(...e),this.addConsoleLog("error",e)},console.warn=(...e)=>{this.originalConsole.warn(...e),this.addConsoleLog("warn",e)},console.info=(...e)=>{this.originalConsole.info(...e),this.addConsoleLog("info",e)},this.$nextTick(()=>{const e=document.querySelector(".scrollable-container");e&&e.classList.add("console-mode")}),console.log("📱 移动端控制台已启用 - "+new Date().toLocaleTimeString()),console.log("URL参数: ",this.getUrlParams())},addConsoleLog(e,t){if(this.shouldFilterLog(t))return;let o="";try{o=t.map(i=>{if(i===null)return"null";if(i===void 0)return"undefined";if(typeof i=="object")try{return JSON.stringify(i,this.jsonReplacer,2)}catch{return"[无法序列化的对象]"}return String(i)}).join(" ")}catch(i){o="日志格式化错误: "+String(i)}const s={type:e,message:o,timestamp:new Date().toLocaleTimeString()};this.consoleLogs.push(s),this.consoleLogs.length>100&&this.consoleLogs.shift(),this.$nextTick(()=>{this.scrollToLatestLog()})},shouldFilterLog(e){if(!this.filterEnabled)return!1;const t=e.map(i=>{if(typeof i=="string")return i.toLowerCase();if(typeof i=="object"&&i!==null)try{return JSON.stringify(i).toLowerCase()}catch{return""}return String(i).toLowerCase()}).join(" ").toLowerCase(),s=["mousemove","mouseover","mouseout","mouseenter","mouseleave","click","dblclick","mousedown","mouseup","touchstart","touchmove","touchend","touchcancel","drag","dragstart","dragend","dragover","dragenter","dragleave","drop","scroll","wheel","clientx","clienty","screenx","screeny","pagex","pagey","offsetx","offsety","addeventlistener","removeeventlistener","__vue__","v-model","emitter","focus","blur","resize","performance","timing","readystate"].some(i=>t.includes(i));return s&&this.filteredLogCount++,s},toggleFilter(){this.filterEnabled=!this.filterEnabled,this.filterEnabled?console.log(`🔍 已启用日志过滤，已过滤 ${this.filteredLogCount} 条日志`):console.log("🔍 已禁用日志过滤，将显示所有日志")},jsonReplacer(e,t){if(this.jsonDepth===void 0&&(this.jsonDepth=0),e!==""&&this.jsonDepth++,this.jsonDepth>3){if(this.jsonDepth--,Array.isArray(t))return`[数组:${t.length}项]`;if(typeof t=="object"&&t!==null)return"[对象]"}return e!==""&&this.jsonDepth--,t},scrollToLatestLog(){if(this.debugLogExpanded){const e=document.querySelector(".console-logs");e&&(e.scrollTop=e.scrollHeight)}},clearConsoleLogs(){this.consoleLogs=[],console.log("控制台日志已清除 - "+new Date().toLocaleTimeString())},toggleDebugLogExpanded(){this.debugLogExpanded=!this.debugLogExpanded,this.debugLogExpanded&&this.$nextTick(()=>{this.scrollToLatestLog()})},setupButtonStyles(){const e=document.querySelector(".button-group");if(!e)return;const t=e.querySelectorAll("button");t.length===1?t[0].classList.add("single-button"):t.length>1&&t.forEach(i=>i.classList.remove("single-button"));const o=e.querySelector(".note-status"),s=document.querySelector(".scrollable-container");o?(e.classList.add("has-status"),s&&s.classList.add("extra-bottom-space")):(e.classList.remove("has-status"),s&&s.classList.add("extra-bottom-space"))},handleScroll(e){},startLoadingAnimation(){let e=0;const t=["初始化...","连接服务器...","获取笔记数据...","准备素材...","即将完成..."],o=setInterval(()=>{this.loading?(e+=3,e>100&&(e=100),this.loadingProgress=Math.floor(e),e<20?this.loadingStage=t[0]:e<40?this.loadingStage=t[1]:e<60?this.loadingStage=t[2]:e<80?this.loadingStage=t[3]:this.loadingStage=t[4],e>=90&&this.loading&&(this.loadingStage="加载时间有点长，请稍候...")):clearInterval(o)},300)},loadXhsSDK(){if(!this.showShareButton){console.log("当前不需要分享功能，跳过加载SDK");return}if(console.log("开始加载小红书SDK..."),window.xhs){console.log("小红书SDK已存在，跳过加载");return}const e=document.createElement("script");e.src="https://fe-static.xhscdn.com/biz-static/goten/xhs-1.0.1.js",e.async=!0,e.defer=!0,e.onload=()=>{console.log("小红书SDK加载成功")},e.onerror=t=>{console.error("小红书SDK加载失败:",t),this.showError("小红书SDK加载失败，请刷新页面重试")},document.head.appendChild(e)},initTouchEvents(){const e=this.$refs.imageSlider;if(!e){console.log("未找到图片轮播组件，跳过触摸事件初始化");return}console.log("初始化触摸事件"),document.body.style.overflow="auto",document.documentElement.style.overflow="auto",document.body.style.touchAction="auto";const t=document.querySelector(".container");t&&(t.style.overflow="auto");const o=document.querySelector(".note-content");o&&(o.style.overflow="auto"),e.removeEventListener("touchstart",this.handleTouchStart),e.removeEventListener("touchmove",this.handleTouchMove),e.removeEventListener("touchend",this.handleTouchEnd),e.removeEventListener("mousedown",this.handleMouseDown),document.removeEventListener("mousemove",this.handleMouseMove),document.removeEventListener("mouseup",this.handleMouseUp),document.removeEventListener("mouseleave",this.handleMouseUp),e.style.touchAction="pan-x",e.querySelectorAll("img").forEach(a=>{a.style.touchAction="pan-x",a.style.userSelect="none",a.draggable=!1});const i=e.querySelector(".note-images");i&&(i.style.touchAction="pan-x",i.style.userSelect="none"),e.addEventListener("touchstart",this.handleTouchStart,{passive:!0}),e.addEventListener("touchmove",this.handleTouchMove,{passive:!1}),e.addEventListener("touchend",this.handleTouchEnd),e.addEventListener("mousedown",this.handleMouseDown),document.addEventListener("mousemove",this.handleMouseMove),document.addEventListener("mouseup",this.handleMouseUp),document.addEventListener("mouseleave",this.handleMouseUp);const n=this.$refs.prevButton,r=this.$refs.nextButton;n&&n.addEventListener("click",()=>this.slideImage(-1)),r&&r.addEventListener("click",()=>this.slideImage(1)),e.addEventListener("dblclick",a=>{a.clientX-e.getBoundingClientRect().left>e.offsetWidth/2?this.slideImage(1):this.slideImage(-1),a.preventDefault()}),console.log("触摸和鼠标事件已初始化")},handleTouchStart(e){if(this.isTransitioning)return;this.startX=e.touches[0].clientX,this.currentX=this.startX,this.startY=e.touches[0].clientY,this.currentY=this.startY,this.touchStartTime=Date.now(),this.isDragging=!0,this.isVerticalScrolling=!1;const o=this.$refs.imageSlider.querySelector(".note-images");o&&(o.style.transition="none"),console.log("触摸开始:",this.startX,this.startY)},handleTouchMove(e){if(!this.isDragging)return;this.currentX=e.touches[0].clientX,this.currentY=e.touches[0].clientY;const t=this.startX-this.currentX,o=this.startY-this.currentY;if(!this.isVerticalScrolling&&Math.abs(o)>Math.abs(t)*1.5){this.isVerticalScrolling=!0,this.touchMoveY=o;return}else if(this.isVerticalScrolling)return;Math.abs(t)>5&&e.preventDefault();const s=this.$refs.imageSlider,i=s.querySelector(".note-images");if(i){const n=-this.currentImageIndex*100-t/s.offsetWidth*100,r=this.limitDragRange(n);i.style.transform=`translateX(${r}%)`}},handleTouchEnd(e){if(!this.isDragging)return;const t=e.changedTouches[0].clientX,o=e.changedTouches[0].clientY,s=this.startX-t,i=this.startY-o;if(this.isVerticalScrolling){this.isDragging=!1,this.isVerticalScrolling=!1;return}const r=this.$refs.imageSlider.querySelector(".note-images");r&&(Math.abs(s)>this.swipeThreshold?s>0?this.slideImage(1):this.slideImage(-1):(r.style.transition="transform 0.3s cubic-bezier(0.215, 0.61, 0.355, 1)",r.style.transform=`translateX(-${this.currentImageIndex*100}%)`,setTimeout(()=>{r.style.transition=""},300))),this.isDragging=!1,this.isVerticalScrolling=!1,console.log("触摸结束, 滑动距离X:",s,"滑动距离Y:",i)},limitDragRange(e){const t=-(this.totalImages-1)*100,o=0;return this.totalImages<=1?-this.currentImageIndex*100:e>o?o+(e-o)*.3:e<t?t+(e-t)*.3:e},handleMouseDown(e){if(this.isTransitioning)return;this.startX=e.clientX,this.currentX=this.startX,this.startY=e.clientY,this.currentY=this.startY,this.isDragging=!0;const o=this.$refs.imageSlider.querySelector(".note-images");o&&(o.style.transition="none"),e.preventDefault(),console.log("鼠标按下:",this.startX,this.startY)},handleMouseMove(e){if(!this.isDragging)return;this.currentX=e.clientX,this.currentY=e.clientY;const t=this.startX-this.currentX,o=this.startY-this.currentY;if(!this.isVerticalScrolling&&Math.abs(o)>Math.abs(t)*1.5){this.isVerticalScrolling=!0,this.touchMoveY=o;return}else if(this.isVerticalScrolling)return;e.preventDefault();const s=this.$refs.imageSlider,i=s.querySelector(".note-images");if(i){const n=-this.currentImageIndex*100-t/s.offsetWidth*100,r=this.limitDragRange(n);i.style.transform=`translateX(${r}%)`}},handleMouseUp(e){if(!this.isDragging)return;const t=e.clientX,o=e.clientY,s=this.startX-t;if(this.startY-o,this.isVerticalScrolling){this.isDragging=!1,this.isVerticalScrolling=!1;return}const n=this.$refs.imageSlider.querySelector(".note-images");n&&(Math.abs(s)>this.swipeThreshold?s>0?this.slideImage(1):this.slideImage(-1):(n.style.transition="transform 0.3s cubic-bezier(0.215, 0.61, 0.355, 1)",n.style.transform=`translateX(-${this.currentImageIndex*100}%)`,setTimeout(()=>{n.style.transition=""},300))),this.isDragging=!1,this.isVerticalScrolling=!1},getUrlParams(){try{const e=I();return!e||!e.query?(console.warn("Route或route.query不可用，返回默认值"),{id:null,identifier:null,platform:null,showBoth:null,isSequential:null,isPreview:null,debug:null,publish:null,token:null}):{id:e.query.id||null,identifier:e.query.identifier||null,platform:e.query.platform||null,showBoth:e.query.showBoth||null,isSequential:e.query.isSequential||null,isPreview:e.query.isPreview||null,debug:e.query.debug||null,publish:e.query.publish||null,token:e.query.token||null}}catch(e){return console.error("获取URL参数失败:",e),{id:null,identifier:null,platform:null,showBoth:null,isSequential:null,isPreview:null,debug:null,publish:null,token:null}}},async initPage(){try{this.isWechatAndroid=this.isWechat()&&this.isAndroid();const e=this.getUrlParams(),t=(e==null?void 0:e.id)||null,o=(e==null?void 0:e.identifier)||null,s=(e==null?void 0:e.platform)||null,i=(e==null?void 0:e.showBoth)||null,n=(e==null?void 0:e.isPreview)||null,r=(e==null?void 0:e.debug)||null,a=(e==null?void 0:e.publish)||null,c=t||o;if(!c){this.showError("未提供帖子ID或identifier，请检查URL参数");return}(r==="1"||r==="true")&&(this.isDebug=!0,console.log("调试模式已启用"),this.setupConsoleCapture()),(a==="1"||a==="true")&&(this.hideNoteContent=!0,console.log("检测到立即发布参数，隐藏笔记内容")),s==="douyin"?this.preferredSharePlatform="douyin":s==="xhs"&&(this.preferredSharePlatform="xhs"),i==="1"||i==="true"?this.showBothShareButtons=!0:(i==="0"||i==="false")&&(this.showBothShareButtons=!1),(n==="1"||n==="true")&&(this.isPreview=!0),this.urlHasIdentifier=!!o;try{this.currentIdentifier=o||"";const u=!!o&&!t,d=this.getPostData(c,u),g=this.getSignatureData(),h=await Promise.all([d,g]),b=h[0],_=h[1];!this.currentIdentifier&&b.identifier&&(this.currentIdentifier=b.identifier),this.updatePageData(b,_),!this.isPreview&&(this.preferredSharePlatform==="douyin"||this.showBothShareButtons)&&this.$nextTick(()=>{this.postData&&this.postData.id?this.getDouyinSchema().catch(w=>{console.error("预加载抖音链接失败:",w)}):console.warn("无法预加载抖音链接：笔记数据尚未准备好")}),(a==="1"||a==="true")&&(console.log("检测到立即发布参数，准备自动发布内容"),setTimeout(async()=>{try{if(this.isDesktop()&&!this.isDebug){console.log("桌面端环境，显示二维码而不是自动发布");return}if(s==="douyin")this.shareToDouyin();else if(s==="xhs")this.shareToXhs();else{const w=this.isXhsUsed,D=this.isDouyinUsed;!w&&!D?this.showPlatformSelectionDialog():w?D?console.log("内容已在两个平台发布，无需执行自动发布"):this.shareToDouyin():this.shareToXhs()}}catch(w){console.error("自动发布失败:",w)}},2e3))}catch(u){console.error("数据获取失败:",u),this.showError(`数据获取失败: ${u.message||u}`);return}setTimeout(()=>{this.initTouchEvents()},1e3)}catch(e){console.error("初始化失败:",e),this.showError(`加载失败: ${e.message}`)}},updatePageData(e,t){console.log("更新页面数据:",{post:e,signature:t}),this.currentImageIndex=0,this.noteSharedByOthers=!1,setTimeout(()=>{this.postData=JSON.parse(JSON.stringify(e)),this.signatureData=t,this.totalImages=e.images?e.images.length:0,this.loading=!1,this.$nextTick(()=>{this.initTouchEvents(),this.setupButtonStyles()})},10),console.log("currentImageIndex:",this.currentImageIndex),console.log("totalImages:",e.images?e.images.length:0),console.log("loading:",this.loading),console.log("showShareButton:",e.isUsed!==1&&e.is_used!==1),console.log("currentIdentifier:",this.currentIdentifier)},showError(e,t="red"){this.error=e,this.errorColor=t,this.loading=!1},showSuccess(e){this.showError(e,"green")},handleImageError(e){const t=e.target;t&&(t.src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%23999"%3E无图片%3C/text%3E%3C/svg%3E')},slideImage(e){if(this.isTransitioning||!this.totalImages)return;this.isTransitioning=!0;const t=this.currentImageIndex;this.currentImageIndex+=e,this.currentImageIndex<0?this.currentImageIndex=this.totalImages-1:this.currentImageIndex>=this.totalImages&&(this.currentImageIndex=0);const s=this.$refs.imageSlider.querySelector(".note-images");if(s){const i=e>0?"cubic-bezier(0.165, 0.84, 0.44, 1)":"cubic-bezier(0.55, 0.055, 0.675, 0.19)";s.style.transition=`transform 0.4s ${i}`,s.style.transform=`translateX(-${this.currentImageIndex*100}%)`,setTimeout(()=>{s.style.transition="",this.isTransitioning=!1},400),this.onSlideChanged(t,this.currentImageIndex)}else this.isTransitioning=!1;console.log("滑动图片:",this.currentImageIndex)},onSlideChanged(e,t){if(console.log(`滑动从 ${e} 变更到 ${t}`),"vibrate"in navigator)try{navigator.vibrate(10)}catch{}},changeSlide(e){if(this.isTransitioning||e===this.currentImageIndex)return;const t=this.currentImageIndex;this.isTransitioning=!0,this.currentImageIndex=e;const s=this.$refs.imageSlider.querySelector(".note-images");s&&(s.style.transition="transform 0.4s cubic-bezier(0.215, 0.61, 0.355, 1)",s.style.transform=`translateX(-${this.currentImageIndex*100}%)`,setTimeout(()=>{s.style.transition="",this.isTransitioning=!1},400),this.onSlideChanged(t,e))},isWechat(){return/MicroMessenger/i.test(navigator.userAgent)},isAndroid(){const e=navigator.userAgent.toLowerCase(),t=/android/.test(e);return console.log("设备检测：",{userAgent:e,isAndroid:t,platform:navigator.platform}),t},isDesktop(){const e=navigator.userAgent.toLowerCase(),t=/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(e),o=window.innerWidth>768;return!t&&o},closeDesktopModal(){this.showDesktopModal=!1},openInBrowser(){const e=window.location.href;console.log("尝试在外部浏览器打开:",e);try{window.location.href=`intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=http;package=com.android.chrome;end`,setTimeout(()=>{try{const t=document.createElement("a");t.href=e,t.target="_system",t.style.display="none",document.body.appendChild(t),t.click()}catch(t){console.error("默认浏览器打开失败:",t)}},500)}catch(t){console.error("打开外部浏览器失败:",t)}},async getPostData(e,t){try{console.log("获取帖子数据，postId:",e,"isIdentifier:",t);let o,s=!1;if(t!==void 0)s=t;else{const a=this.getUrlParams();s=!!(a!=null&&a.identifier)&&!(a!=null&&a.id)}if(s){o=`${this.API_DOMAIN}/xhs-auto/notes?identifier=${encodeURIComponent(e)}`;const a=this.getUrlParams(),c=(a==null?void 0:a.platform)||null;if(c){const u=new URLSearchParams;u.append("platform",c),u.toString()&&(o+=`&${u.toString()}`)}}else o=`${this.API_DOMAIN}/xhs-auto/notes/${e}`;console.log("请求URL:",o);const i=await fetch(o),n=await i.json();if(console.log("获取到的原始数据:",n),!i.ok)throw new Error(`获取帖子数据失败: ${i.status} ${i.statusText}`);let r;if(s)if(Array.isArray(n)){if(n.length===0)throw new Error("没有找到符合条件的笔记");r=n[0]}else if(n.data&&Array.isArray(n.data)){if(n.data.length===0)throw new Error("没有找到符合条件的笔记");r=n.data[0]}else throw new Error("返回数据格式错误");else r=n.data||n;return console.log("处理后的帖子数据:",r),r.title||(console.warn("帖子标题不存在，使用默认值"),r.title="无标题"),r.content||(console.warn("帖子内容不存在，使用默认值"),r.content="无内容"),(!r.images||!Array.isArray(r.images))&&(console.warn("帖子图片不存在或格式错误，使用空数组"),r.images=[]),this.updateUsedStatus(r),r.type||(console.warn("帖子类型不存在，设置为默认类型"),r.type="note"),r}catch(o){throw console.error("获取帖子数据出错:",o),this.showError(`获取帖子数据失败: ${o}`),o}},updateUsedStatus(e){if(!e)return;const t=e.isUsed!==void 0?e.isUsed:e.is_used!==void 0?e.is_used:0;let o;typeof t=="boolean"?o=t?1:0:typeof t=="string"?o=t.toLowerCase()==="true"?1:parseInt(t,10):o=t,this.isXhsUsed=o===1||t===!0;const s=e.isDouyinUsed!==void 0?e.isDouyinUsed:e.is_douyin_used!==void 0?e.is_douyin_used:0;let i;typeof s=="boolean"?i=s?1:0:typeof s=="string"?i=s.toLowerCase()==="true"?1:parseInt(s,10):i=s,this.isDouyinUsed=i===1||s===!0,console.log("平台发布状态更新:",{xhs:this.isXhsUsed,douyin:this.isDouyinUsed})},async getSignatureData(){try{const e=await fetch(`${this.API_DOMAIN}/xhs-auto/signature`),t=await e.json();if(!e.ok)throw new Error(`获取签名数据失败: ${e.status} ${e.statusText}`);return t.data?t.data.data||t.data:t}catch(e){throw console.error("获取签名数据出错:",e),this.showError(`获取签名数据失败: ${e}`),e}},xhsFn(){return new Promise((e,t)=>{if(!this.postData||!this.signatureData){t(new Error("数据加载失败，请刷新页面重试"));return}console.log("分享数据:",this.postData),console.log("签名数据:",this.signatureData);const o={appKey:this.signatureData.appKey||this.signatureData.app_key,signature:this.signatureData.signature,timestamp:this.signatureData.timestamp,nonce:this.signatureData.nonce};if(console.log("准备分享，verifyConfig:",o),!window.xhs){console.error("未找到小红书SDK，尝试重新加载"),this.loadXhsSDK(),setTimeout(()=>{try{this.executeShare(o,e,t)}catch(s){t(s)}},500);return}try{this.executeShare(o,e,t)}catch(s){t(s)}})},executeShare(e,t,o){const s=this.API_DOMAIN,i={type:this.postData.type,title:this.postData.title,content:this.postData.content,images:this.postData.images,video:this.postData.video||"",cover:this.postData.cover||""};!e.appKey||e.appKey.includes("*")?(console.log("检测到appKey被混淆，获取完整签名信息"),fetch(`${s}/xhs-auto/signature`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({signature:e.signature,timestamp:e.timestamp,nonce:e.nonce})}).then(n=>n.json()).then(n=>{if(n&&n.data){const r=n.data;this.performShare(i,r,t,o),console.log("成功调用小红书分享方法")}else o(new Error("获取完整签名信息失败"))}).catch(n=>{console.error("获取完整签名信息失败:",n),o(n)})):(this.performShare(i,e,t,o),console.log("成功调用小红书分享方法"))},performShare(e,t,o,s){if(console.log("执行分享，分享信息:",e),console.log("验证配置:",t),this.doShareWithXhs(e,t,o,s),!this.isDebug&&this.postData&&this.postData.id){console.log("标记笔记为已使用，ID:",this.postData.id);const i=this.getUrlParams(),n=(i==null?void 0:i.platform)||null;let r=`${this.API_DOMAIN}/xhs-auto/notes/${this.postData.id}/used`;n==="xhs"&&(r+="?platform=xhs"),fetch(r,{method:"POST",headers:{"Content-Type":"application/json"}}).then(a=>a.json()).then(a=>{console.log("标记笔记状态结果:",a),this.isXhsUsed=!0,this.showSuccess("分享成功！")}).catch(a=>{console.error("标记笔记状态失败:",a),this.showSuccess("分享成功！(状态更新失败)")})}else this.isDebug?(console.log("调试模式：分享成功，但不更新笔记状态"),this.showSuccess("分享成功！(调试模式)")):this.showSuccess("分享成功！")},doShareWithXhs(e,t,o,s){window.xhs.share({shareInfo:e,verifyConfig:t,fail:i=>{console.log("分享失败:",i),this.showErrorDialog(`分享失败: ${i.message||"未知错误"}`),s(i)},success:()=>{console.log("分享成功"),o({success:!0})}})},async shareToXhs(){try{if(this.isDesktop()&&!this.isDebug){console.log("检测到桌面端访问，显示提示弹窗");try{const e=window.location.href;let t=e;if(e.includes("isPreview=")){const o=new URL(e),s=o.hash;if(s.includes("?")){const[i,n]=s.split("?"),r=new URLSearchParams(n);r.delete("isPreview");const a=r.toString(),c=a?`${i}?${a}`:i;t=`${o.origin}${o.pathname}#${c}`}}this.qrCodeUrl=`https://xhs.aivip1.top/api/html-render/qrcode?size=100x100&data=${encodeURIComponent(t)}`,this.showDesktopModal=!0;return}catch(e){console.error("生成二维码失败:",e),this.qrCodeUrl=""}}if(this.noteSharedByOthers=!1,this.isWechatAndroid){console.log("安卓微信环境下点击分享，引导用户到外部浏览器"),document.body.classList.add("wechat-open-browser"),this.showError('点击右上角菜单，选择"在浏览器打开"',"#ff7700");const e=document.createElement("div");e.className="wechat-open-tip",e.innerHTML=`
            <div class="tip-content">
              <div class="tip-icon">↗️</div>
              <div class="tip-text">
                <strong>请点击右上角</strong>
                <br>然后选择"在浏览器中打开"
              </div>
              <div class="tip-close" onclick="this.parentNode.parentNode.remove()">×</div>
            </div>
          `,document.body.appendChild(e),setTimeout(()=>{this.openInBrowser()},3e3);return}if(!this.postData||!this.signatureData){this.showError("数据未准备好，请稍后再试");return}try{const e=await this.getPostData(this.postData.id);if(this.isXhsUsed){this.noteSharedByOthers=!0;return}}catch(e){console.error("获取最新笔记状态失败:",e)}try{const e=await this.xhsFn();console.log("小红书分享调用成功:",e)}catch(e){console.error("分享失败:",e),this.showErrorDialog(`分享失败: ${e.message||"未知错误"}`),this.showError(`分享失败: ${e.message||"未知错误"}`)}}catch(e){console.error("分享操作发生异常:",e),this.showErrorDialog(`分享失败: ${e.message||"未知错误"}`),this.showError(`分享失败: ${e.message||"未知错误"}`)}},async loadNextNote(e){var t,o;if(!this.nextButtonDisabled)try{this.loading=!0,this.error="",this.nextButtonDisabled=!0,this.noteSharedByOthers=!1;const s=this.getUrlParams(),i=(s==null?void 0:s.isSequential)||"0",n=e!==void 0?e:i==="1";console.log("当前笔记数据:",{currentIdentifier:this.currentIdentifier,postId:(t=this.postData)==null?void 0:t.id,platform:this.preferredSharePlatform,isSequential:n});let r=`${this.API_DOMAIN}/xhs-auto/notes`;const a=new URLSearchParams;if(this.currentIdentifier){if(a.append("isUsed","0"),a.append("identifier",this.currentIdentifier),this.postData&&this.postData.id&&a.append("id",this.postData.id.toString()),this.preferredSharePlatform){const b=(s==null?void 0:s.platform)||null;b&&a.append("platform",b)}a.append("isSequential",n?"1":"0")}r=`${r}?${a.toString()}`,console.log("请求下一篇笔记，URL:",r);const c=await fetch(r);let u=await c.json();console.log("获取到的下一篇笔记原始数据:",u);const d=this.currentIdentifier;let g=null;if(Array.isArray(u)?u.length>0&&(g=u[0]):u.data&&Array.isArray(u.data)?u.data.length>0&&(g=u.data[0]):g=u,!c.ok){if(c.status===404){this.showError("没有更多笔记了"),this.currentIdentifier="";return}throw new Error(`获取下一篇笔记失败: ${c.status} ${c.statusText}`)}if(!g){this.showError("没有更多笔记了"),this.currentIdentifier="";return}if(g.id===((o=this.postData)==null?void 0:o.id)){this.showError("没有更多笔记了"),this.currentIdentifier="";return}const h=await this.getSignatureData();this.currentIdentifier===d&&(this.currentIdentifier=g.identifier||this.currentIdentifier),this.updatePageData(g,h),this.updateUsedStatus(g),this.nextButtonDisabled=!1}catch(s){console.error("加载下一篇笔记失败:",s),this.showError(`加载下一篇笔记失败: ${s.message}`),this.nextButtonDisabled=!1}},async getDouyinSchema(e=0){try{if(!this.postData)throw new Error("笔记数据不存在");if(!this.postData.id)throw new Error("笔记ID不存在");const t=this.postData.id;this.douyinSchemaLoading=!0,this.douyinSchemaError="";const o=`${this.API_DOMAIN}/xhs-auto/douyin-schema/${t}`;console.log("请求抖音Schema, URL:",o);const s=new AbortController,i=setTimeout(()=>s.abort(),15e3);try{const n=await fetch(o,{signal:s.signal,headers:{Accept:"application/json","Cache-Control":"no-cache"}});clearTimeout(i);const r=n.headers.get("content-type");if(!r||!r.includes("application/json")){console.error("API返回非JSON格式:",r);const u=await n.text();throw console.error("API返回内容:",u.substring(0,200)+"..."),new Error("API返回格式错误，请联系管理员")}const a=await n.json();if(!n.ok)throw new Error(`获取抖音分享链接失败: ${n.status} ${n.statusText}`);let c="";if(console.log("API返回完整数据:",JSON.stringify(a).substring(0,200)+"..."),a.data&&typeof a.data=="object"&&a.data.data)c=a.data.data;else if(a.data&&typeof a.data=="string")c=a.data;else throw new Error("获取抖音分享链接失败: 返回数据格式不正确");if(!c)throw new Error("获取抖音分享链接失败: 返回数据为空");if(!c.startsWith("snssdk1128://"))if(console.warn("返回的URL不是抖音schema格式，尝试修复:",c),c.includes("snssdk1128://")){const u=c.match(/(snssdk1128:\/\/[^\s"']+)/);u&&u[1]&&(c=u[1],console.log("提取到的抖音schema链接:",c))}else throw console.error("无法从返回数据中找到有效的抖音schema链接"),new Error("返回的不是有效的抖音schema链接");return console.log("获取到的抖音分享链接:",c),this.douyinSchema=c,c}catch(n){throw clearTimeout(i),n.name==="AbortError"?new Error("获取分享链接超时，请稍后再试"):n}}catch(t){let o=t.message||"未知错误";if(t instanceof SyntaxError&&o.includes("JSON")&&(o="API返回格式错误，服务器可能暂时不可用",console.error("JSON解析错误，可能是服务器返回了非JSON格式:",t)),console.error("获取抖音分享链接失败:",t),e<2)return console.log(`尝试第${e+1}次重试...`),this.douyinSchemaError=`获取链接中(${e+1}/3)...`,new Promise((s,i)=>{setTimeout(async()=>{try{const n=await this.getDouyinSchema(e+1);s(n)}catch(n){this.douyinSchemaError=`获取抖音分享链接失败: ${o}`,i(n)}},1e3)});throw this.douyinSchemaError=`获取抖音分享链接失败: ${o}`,t}finally{e===0&&(this.douyinSchemaLoading=!1)}},async shareToDouyin(){try{if(this.isDesktop()&&!this.isDebug){console.log("检测到桌面端访问，显示提示弹窗");try{const o=window.location.href;let s=o;if(o.includes("isPreview=")){const i=new URL(o),n=i.hash;if(n.includes("?")){const[r,a]=n.split("?"),c=new URLSearchParams(a);c.delete("isPreview");const u=c.toString(),d=u?`${r}?${u}`:r;s=`${i.origin}${i.pathname}#${d}`}}this.qrCodeUrl=`https://xhs.aivip1.top/api/html-render/qrcode?size=200x200&data=${encodeURIComponent(s)}`,this.showDesktopModal=!0;return}catch(o){console.error("生成二维码失败:",o),this.qrCodeUrl=""}}if(this.douyinShared=!1,this.isWechat()){console.log("微信环境下点击分享，引导用户到外部浏览器"),document.body.classList.add("wechat-open-browser"),this.showError('请点击右上角菜单，选择"在浏览器打开"以继续操作',"#ff7700");const o=document.createElement("div");o.className="wechat-open-tip",o.innerHTML=`
            <div class="tip-content">
              <div class="tip-icon">↗️</div>
              <div class="tip-text">
                <strong>请点击右上角菜单</strong>
                <br>然后选择"在浏览器中打开"
                <br><small>微信环境下无法直接分享到抖音</small>
              </div>
              <div class="tip-close" onclick="this.parentNode.parentNode.remove()">×</div>
            </div>
          `,document.body.appendChild(o),setTimeout(()=>{this.openInBrowser()},3e3);return}if(!this.postData){this.showError("数据未准备好，请稍后再试");return}this.douyinSchemaLoading=!0;let e;try{e=await this.getDouyinSchema(),console.log("%c抖音分享完整链接信息","color: green; font-weight: bold;",{完整链接:e,长度:e.length,时间戳:new Date().toLocaleString()}),this.analyzeDouyinSignature(e),this.douyinSchemaLoading=!1}catch(o){this.douyinSchemaLoading=!1,this.showError(`获取抖音分享链接失败: ${o.message}`);return}console.log("打开抖音分享链接:",e);const t=new Date().getTime();this.openDouyinOptimized(e),this.douyinShared=!0,this.showSuccess("正在跳转到抖音..."),setTimeout(async()=>{if(!this.isDebug&&this.postData&&this.postData.id)try{let o=`${this.API_DOMAIN}/xhs-auto/notes/${this.postData.id}/used?platform=douyin`;const s=await fetch(o,{method:"POST",headers:{"Content-Type":"application/json"}});console.log("标记抖音发布状态响应:",{状态码:s.status,状态文本:s.statusText});const i=await s.json();console.log("标记抖音发布状态结果:",i),this.postData&&(this.postData.douyinUsed=!0,"douyin_status"in this.postData&&(this.postData.douyin_status=!0),this.isDouyinUsed=!0)}catch(o){console.error("标记抖音发布状态失败:",o)}else this.isDebug&&console.log("调试模式：抖音分享不更新服务器状态")},5e3)}catch(e){console.error("分享到抖音失败:",e),this.showErrorDialog(`分享到抖音失败: ${e.message||"未知错误"}`),this.showError(`分享到抖音失败: ${e.message||"未知错误"}`)}},openDouyinOptimized(e){if(console.log("%c尝试唤起抖音应用","color: orange; font-weight: bold;",{设备类型:/iPhone|iPad|iPod/i.test(navigator.userAgent)?"iOS":"Android",浏览器:navigator.userAgent,链接:e,时间:new Date().toLocaleString()}),!e){this.showError("抖音分享链接无效");return}const t=/iPhone|iPad|iPod/i.test(navigator.userAgent),o=t?"https://apps.apple.com/cn/app/id1142110895":"https://www.douyin.com/download",s=Date.now();setTimeout(()=>{Date.now()-s<2500&&(console.log("抖音可能未成功唤起，显示分享链接对话框"),this.showOpenDouyinDialog(e,o))},2500);try{t?this.openDouyinInIOS(e,o):this.openDouyinInAndroid(e,o)}catch(n){console.error("唤起抖音失败:",n),this.showOpenDouyinDialog(e,o)}},openDouyinInIOS(e,t){console.log("%ciOS设备唤起抖音","color: purple; font-weight: bold;",{原始链接:e,使用方式:"iframe + location.href",时间:new Date().toLocaleString()});const o=document.createElement("iframe");o.setAttribute("style","display:none"),o.src=e,document.body.appendChild(o),setTimeout(()=>{document.body.contains(o)&&document.body.removeChild(o)},2e3),setTimeout(()=>{try{console.log("%ciOS通过location.href跳转","color: #ff5500; font-size: 14px; font-weight: bold;",{跳转链接:e,时间:new Date().toLocaleTimeString(),navigator:navigator.userAgent.substring(0,100)}),window.location.href=e}catch(s){console.error("location跳转失败:",s)}},100)},openDouyinInAndroid(e,t){console.log("%cAndroid设备唤起抖音","color: brown; font-weight: bold;",{原始链接:e,时间:new Date().toLocaleString()}),this.analyzeDouyinSignature(e);const o=document.createElement("iframe");o.setAttribute("style","display:none;border:0;width:0;height:0;"),document.body.appendChild(o);const s=this.convertToIntentUrl(e);console.log("%cAndroid Intent URL","color: #ff9900; font-weight: bold;",{转换后Intent链接:s||"转换失败",时间:new Date().toLocaleString()});try{o.src=e}catch(i){console.error("iframe设置src失败:",i)}setTimeout(()=>{try{const i=s||e;console.log("%cAndroid通过location.href跳转","color: #ff5500; font-size: 14px; font-weight: bold;",{跳转链接类型:s?"intent链接":"原始schema链接",跳转链接:i.substring(0,100)+"...",完整链接长度:i.length,时间:new Date().toLocaleTimeString(),navigator:navigator.userAgent.substring(0,100)}),window.location.href=i}catch(i){console.error("location跳转失败:",i)}},100),setTimeout(()=>{document.body.contains(o)&&document.body.removeChild(o)},1500),setTimeout(()=>{try{console.log("%c通过window.open跳转","color: #ff5500; font-size: 14px; font-weight: bold;",{跳转链接:e.substring(0,100)+"...",完整链接长度:e.length,时间:new Date().toLocaleTimeString()}),window.open(e,"_self")}catch(i){console.error("window.open失败:",i)}},200),setTimeout(()=>{try{console.log("%c通过a标签点击跳转","color: #ff5500; font-size: 14px; font-weight: bold;",{跳转链接:e.substring(0,100)+"...",完整链接长度:e.length,时间:new Date().toLocaleTimeString()});const i=document.createElement("a");i.setAttribute("href",e),i.setAttribute("style","display:none"),document.body.appendChild(i),i.click(),setTimeout(()=>{document.body.contains(i)&&document.body.removeChild(i)},500)}catch(i){console.error("a标签点击方法失败:",i)}},300)},convertToIntentUrl(e){if(!e.startsWith("snssdk1128://"))return console.warn("链接不是抖音专用协议，无法转换为intent格式:",e),"";try{const t=e.indexOf("?");if(t===-1)return console.warn("抖音链接没有参数部分，无法转换:",e),"";const o=e.substring(t+1),s=e.substring(0,t).replace("snssdk1128://",""),r=`intent://${s}?${o}#Intent;scheme=snssdk1128;package=com.ss.android.ugc.aweme;action=android.intent.action.VIEW;end`;return console.log("%c生成intent URL成功","color: green; font-weight: bold;",{原始链接:e.substring(0,50)+"...",路径部分:s,参数部分:o.substring(0,50)+"...",完整Intent:r.substring(0,50)+"...",时间:new Date().toLocaleString()}),r}catch(t){return console.error("转换intent URL失败:",t),""}},showOpenDouyinDialog(e,t){console.log("显示抖音打开选项对话框，完整链接:",e);const o=document.querySelector(".douyin-open-dialog");o&&o.parentNode&&o.parentNode.removeChild(o);const s=document.createElement("div");s.className="douyin-open-dialog",s.innerHTML=`
        <div class="dialog-overlay"></div>
        <div class="dialog-content">
          <div class="dialog-header">
            <h3>打开抖音</h3>
            <button class="close-btn">&times;</button>
          </div>
          <div class="dialog-body">
            <p class="dialog-tip">未检测到抖音APP或打开失败，请选择以下操作：</p>
            
            <div class="schema-url-container">
              <div class="schema-url-label">分享链接：</div>
              <div class="schema-url-value">${e.substring(0,100)}...</div>
              <button class="copy-url-btn">复制完整链接</button>
            </div>
            
            <div class="dialog-buttons">
              <button class="open-btn">
                <span class="icon">🚀</span>
                <span class="text">重新打开抖音</span>
              </button>
              <button class="download-btn">
                <span class="icon">📲</span>
                <span class="text">下载抖音</span>
              </button>
              <button class="copy-btn">
                <span class="icon">📋</span>
                <span class="text">复制分享链接</span>
              </button>
              <button class="browser-btn">
                <span class="icon">🌐</span>
                <span class="text">在浏览器中打开</span>
              </button>
            </div>
          </div>
          <div class="dialog-footer">
            <p class="note">提示：如果已安装抖音但无法打开，可能是网络问题或签名已过期</p>
            <p class="note">您可以尝试复制链接并直接在浏览器地址栏粘贴访问</p>
          </div>
        </div>
      `;const i=document.createElement("style");i.textContent=`
        .douyin-open-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s;
        }
        
        .dialog-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
        }
        
        .dialog-content {
          position: relative;
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 420px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          animation: slideUp 0.3s;
        }
        
        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
          background: #ff2c55;
          color: white;
        }
        
        .dialog-header h3 {
          margin: 0;
          font-size: 18px;
          color: white;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: white;
          cursor: pointer;
        }
        
        .dialog-body {
          padding: 20px;
        }
        
        .dialog-tip {
          margin: 0 0 15px;
          color: #666;
        }
        
        .schema-url-container {
          background: #f7f7f7;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 20px;
        }
        
        .schema-url-label {
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
        }
        
        .schema-url-value {
          font-family: monospace;
          word-break: break-all;
          background: #fff;
          border: 1px solid #ddd;
          padding: 8px;
          border-radius: 4px;
          color: #0066cc;
          max-height: 60px;
          overflow-y: auto;
          margin-bottom: 8px;
        }
        
        .copy-url-btn {
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
        }
        
        .dialog-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .dialog-buttons button {
          border: none;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f7f7f7;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .dialog-buttons button:hover {
          background: #eee;
        }
        
        .dialog-buttons .open-btn {
          background: #ff2c55;
          color: white;
        }
        
        .dialog-buttons .open-btn:hover {
          background: #e61e4d;
        }
        
        .dialog-buttons .icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .dialog-footer {
          padding: 15px 20px;
          border-top: 1px solid #eee;
          background: #f9f9f9;
        }
        
        .dialog-footer .note {
          margin: 5px 0;
          font-size: 12px;
          color: #666;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `,document.head.appendChild(i),document.body.appendChild(s);const n=s.querySelector(".close-btn");n&&n.addEventListener("click",()=>{document.body.removeChild(s)});const r=s.querySelector(".copy-url-btn");r&&r.addEventListener("click",()=>{try{const h=document.createElement("textarea");h.value=e,document.body.appendChild(h),h.select(),document.execCommand("copy"),document.body.removeChild(h),r.textContent="✓ 复制成功",r.style.background="#4CAF50",setTimeout(()=>{r.textContent="复制完整链接",r.style.background="#2196F3"},3e3)}catch(h){console.error("复制链接失败:",h),r.textContent="✗ 复制失败",r.style.background="#F44336"}});const a=s.querySelector(".open-btn");a&&a.addEventListener("click",()=>{try{console.log("%c用户点击重新打开抖音按钮","color: #ff5500; font-size: 14px; font-weight: bold;",{跳转链接:e.substring(0,100)+"...",完整链接长度:e.length,时间:new Date().toLocaleTimeString()}),window.location.href=e,setTimeout(()=>{document.body.contains(s)&&document.body.removeChild(s)},500)}catch(h){console.error("重新打开抖音失败:",h)}});const c=s.querySelector(".download-btn");c&&c.addEventListener("click",()=>{window.location.href=t,setTimeout(()=>{document.body.contains(s)&&document.body.removeChild(s)},500)});const u=s.querySelector(".copy-btn");u&&u.addEventListener("click",()=>{try{const h=document.createElement("textarea");h.value=e,document.body.appendChild(h),h.select(),document.execCommand("copy"),document.body.removeChild(h),this.showSuccess("链接已复制到剪贴板"),document.body.contains(s)&&document.body.removeChild(s)}catch(h){console.error("复制链接失败:",h)}});const d=s.querySelector(".browser-btn");d&&d.addEventListener("click",()=>{try{window.open(e,"_blank"),setTimeout(()=>{document.body.contains(s)&&document.body.removeChild(s)},500)}catch(h){console.error("在浏览器中打开失败:",h)}});const g=s.querySelector(".dialog-overlay");g&&g.addEventListener("click",h=>{h.target===g&&document.body.removeChild(s)})},processApiResponse(e){if(!e){console.error("API返回的数据为空"),this.showError("没有数据返回，请刷新重试");return}console.log("处理API返回数据:",JSON.stringify(e).substring(0,200)+"...");try{let t=e;e.data&&typeof e.data=="object"?t=e.data:e.data&&Array.isArray(e.data)&&e.data.length>0&&(t=e.data[0]);const o=["images","imgs","image_list","imgList"];for(const r of o)if(t[r]){let a=t[r];if(typeof a=="string")try{a=JSON.parse(a)}catch{a=[a]}Array.isArray(a)||(a=[a]),t.images=a;break}const s=["content","desc","description","text"];for(const r of s)if(t[r]){t.content=t[r];break}const i=["title","name","headline"];for(const r of i)if(t[r]){t.title=t[r];break}const n=["id","noteId","post_id"];for(const r of n)if(t[r]){t.id=t[r];break}this.postData=t,this.updateUsedStatus(t),t.images&&t.images.length>0&&(this.totalImages=t.images.length),console.log("数据处理完成:",{id:t.id,图片数量:t.images?t.images.length:0,内容长度:t.content?t.content.length:0,抖音状态:this.isDouyinUsed,小红书状态:this.isXhsUsed})}catch(t){console.error("处理API返回数据时出错:",t),this.showError("数据处理失败，请刷新重试")}},async fetchWithRetry(e,t={},o=3,s=1e3){try{const i=await fetch(e,t);if(!i.ok)throw new Error(`HTTP 错误! 状态码: ${i.status}`);return i}catch(i){if(o<=1)throw i;return console.log(`请求失败，${s/1e3}秒后重试..., 剩余重试次数: ${o-1}`),new Promise(n=>{setTimeout(()=>{n(this.fetchWithRetry(e,t,o-1,s))},s)})}},goToSharePage(){try{let e=window.location.href;if(e.includes("#")&&e.includes("isPreview=")){const[t,o]=e.split("#");if(o.includes("?")){const[s,i]=o.split("?"),n=new URLSearchParams(i);n.delete("isPreview");const r=n.toString(),a=r?`${s}?${r}`:s;e=`${t}#${a}`}}console.log("跳转到分享页面:",e),this.openSharePageFromPopup(e)}catch(e){console.error("跳转到分享页面失败:",e),this.showError(`跳转失败: ${e.message||"未知错误"}`)}},openSharePageFromPopup(e){console.log("需要打开的分享页面URL:",e);const t=navigator.userAgent;console.log("当前设备User-Agent:",t);const o=/HarmonyOS/i.test(t),s=/EMUI/i.test(t),i=/Magic UI/i.test(t),n=/HUAWEI|HONOR/i.test(t),r=n||o||s||i;if(console.log("设备检测结果:",{isHuawei:n,isHarmonyOS:o,isEmui:s,isMagicUI:i,isHuaweiEnvironment:r,userAgent:t.substring(0,100)+"..."}),!r){console.log("非华为/鸿蒙设备，尝试直接跳转");try{if(window.open(e,"_blank")){console.log("成功在新页面打开链接");return}else{console.warn("window.open可能被浏览器拦截，尝试替代方法");const D=document.createElement("a");D.href=e,D.target="_blank",D.rel="noopener noreferrer",D.style.display="none",document.body.appendChild(D),D.click(),document.body.removeChild(D);return}}catch(w){console.error("所有新页面打开方法都失败:",w)}}console.log("检测到华为/鸿蒙设备，显示辅助跳转弹窗");const a=document.createElement("div");a.className="harmony-solution-overlay",a.style.position="fixed",a.style.top="0",a.style.left="0",a.style.width="100%",a.style.height="100%",a.style.backgroundColor="rgba(0, 0, 0, 0.9)",a.style.zIndex="999999",a.style.display="flex",a.style.flexDirection="column",a.style.justifyContent="center",a.style.alignItems="center",a.style.padding="20px";const c=document.createElement("div");c.style.width="100%",c.style.maxWidth="400px",c.style.backgroundColor="white",c.style.borderRadius="12px",c.style.boxShadow="0 10px 25px rgba(0, 0, 0, 0.5)",c.style.overflow="hidden";const u=document.createElement("div");u.style.padding="15px",u.style.backgroundColor="#4285F4",u.style.color="white",u.style.fontSize="18px",u.style.fontWeight="bold",u.style.textAlign="center",u.textContent="无法自动跳转",c.appendChild(u);const d=document.createElement("div");d.style.padding="20px",d.style.fontSize="16px",d.style.lineHeight="1.5",d.style.color="#333",d.innerHTML=`
        <p style="margin-bottom:15px;"><strong>检测到华为/鸿蒙系统</strong>，无法自动跳转到分享页面。</p>
        <p style="margin-bottom:15px;">请按照以下步骤操作：</p>
        <ol style="margin-left:20px;margin-bottom:15px;">
          <li style="margin-bottom:8px;">点击下方"复制链接"按钮</li>
          <li style="margin-bottom:8px;">粘贴并访问链接或点击二维码按钮打开</li>
        </ol>
      `,c.appendChild(d);const g=document.createElement("div");g.style.margin="0 20px 20px",g.style.padding="10px",g.style.backgroundColor="#f5f5f5",g.style.border="1px solid #ddd",g.style.borderRadius="5px",g.style.fontSize="14px",g.style.wordBreak="break-all",g.style.color="#0066cc",g.textContent=e,c.appendChild(g);const h=document.createElement("div");h.style.display="flex",h.style.padding="0 20px 20px",h.style.gap="10px";const b=document.createElement("button");b.style.flex="1",b.style.padding="12px",b.style.backgroundColor="#4285F4",b.style.color="white",b.style.border="none",b.style.borderRadius="5px",b.style.fontSize="16px",b.style.fontWeight="bold",b.style.cursor="pointer",b.textContent="复制链接",b.addEventListener("click",()=>{const w=document.createElement("textarea");w.value=e,w.style.position="absolute",w.style.left="-9999px",document.body.appendChild(w),w.select(),w.setSelectionRange(0,99999),document.execCommand("copy"),document.body.removeChild(w),b.textContent="✓ 复制成功",b.style.backgroundColor="#4CAF50",setTimeout(()=>{b.textContent="复制链接",b.style.backgroundColor="#4285F4"},3e3)}),h.appendChild(b);const _=document.createElement("button");_.style.flex="1",_.style.padding="12px",_.style.backgroundColor="#f5f5f5",_.style.color="#333",_.style.border="1px solid #ddd",_.style.borderRadius="5px",_.style.fontSize="16px",_.style.cursor="pointer",_.textContent="关闭",_.addEventListener("click",()=>{document.body.removeChild(a)}),h.appendChild(_),c.appendChild(h),a.appendChild(c),document.body.appendChild(a);try{window.open(e,"_blank")}catch(w){console.error("window.open 失败:",w)}this.showError('如需跳转，请点击页面顶部的"复制链接"按钮',"#4285F4")},showPlatformSelectionDialog(){const e=document.createElement("div");e.className="platform-selection-dialog",e.innerHTML=`
        <div class="platform-dialog-overlay"></div>
        <div class="platform-dialog-content">
          <div class="platform-dialog-header">
            <h3>选择分享平台</h3>
            <button class="close-btn">&times;</button>
          </div>
          <div class="platform-dialog-body">
            <p>请选择要分享到的平台：</p>
            <div class="platform-options">
              <button class="platform-option xhs-option">
                <span class="platform-icon">🔺</span>
                <span class="platform-name">分享到小红书</span>
              </button>
              <button class="platform-option douyin-option">
                <span class="platform-icon">🎵</span>
                <span class="platform-name">分享到抖音</span>
              </button>
            </div>
          </div>
        </div>
      `;const t=document.createElement("style");t.textContent=`
        .platform-selection-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .platform-dialog-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
        }
        
        .platform-dialog-content {
          position: relative;
          width: 90%;
          max-width: 320px;
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          animation: platformDialogFadeIn 0.3s ease;
        }
        
        .platform-dialog-header {
          padding: 15px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .platform-dialog-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #999;
          cursor: pointer;
        }
        
        .platform-dialog-body {
          padding: 20px;
        }
        
        .platform-dialog-body p {
          margin: 0 0 15px;
          text-align: center;
          color: #666;
        }
        
        .platform-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .platform-option {
          display: flex;
          align-items: center;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .platform-option:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .xhs-option {
          border-color: #ff3370;
        }
        
        .douyin-option {
          border-color: #000;
        }
        
        .platform-icon {
          font-size: 24px;
          margin-right: 10px;
        }
        
        .platform-name {
          font-size: 16px;
          font-weight: 500;
        }
        
        @keyframes platformDialogFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `,document.head.appendChild(t),document.body.appendChild(e);const o=e.querySelector(".close-btn");o&&o.addEventListener("click",()=>{document.body.removeChild(e),document.head.removeChild(t)});const s=e.querySelector(".xhs-option");s&&s.addEventListener("click",()=>{document.body.removeChild(e),document.head.removeChild(t),this.shareToXhs()});const i=e.querySelector(".douyin-option");i&&i.addEventListener("click",()=>{document.body.removeChild(e),document.head.removeChild(t),this.shareToDouyin()});const n=e.querySelector(".platform-dialog-overlay");n&&n.addEventListener("click",()=>{document.body.removeChild(e),document.head.removeChild(t)})},showErrorDialog(e){const t=document.createElement("div");t.className="error-dialog-container",t.style.position="fixed",t.style.top="0",t.style.left="0",t.style.width="100%",t.style.height="100%",t.style.backgroundColor="rgba(0, 0, 0, 0.7)",t.style.display="flex",t.style.justifyContent="center",t.style.alignItems="center",t.style.zIndex="9999";const o=document.createElement("div");o.className="error-dialog-content",o.style.backgroundColor="white",o.style.borderRadius="8px",o.style.padding="20px",o.style.maxWidth="80%",o.style.boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)",o.style.display="flex",o.style.flexDirection="column",o.style.alignItems="center";const s=document.createElement("div");s.className="error-icon",s.style.width="50px",s.style.height="50px",s.style.borderRadius="50%",s.style.backgroundColor="#ff3333",s.style.display="flex",s.style.justifyContent="center",s.style.alignItems="center",s.style.marginBottom="15px",s.style.color="white",s.style.fontSize="32px",s.style.fontWeight="bold",s.innerHTML="!";const i=document.createElement("h3");i.className="error-title",i.style.margin="0 0 10px",i.style.fontSize="18px",i.style.color="#333",i.textContent="错误提示";const n=document.createElement("p");n.className="error-message",n.style.margin="0 0 20px",n.style.fontSize="16px",n.style.color="#666",n.style.textAlign="center",n.textContent=e;const r=document.createElement("button");r.className="error-close-button",r.style.padding="8px 16px",r.style.backgroundColor="#f5f5f5",r.style.border="1px solid #ddd",r.style.borderRadius="4px",r.style.color="#333",r.style.fontSize="14px",r.style.cursor="pointer",r.textContent="知道了",r.addEventListener("click",()=>{document.body.removeChild(t)}),o.appendChild(s),o.appendChild(i),o.appendChild(n),o.appendChild(r),t.appendChild(o),document.body.appendChild(t),t.addEventListener("click",a=>{a.target===t&&document.body.removeChild(t)})},analyzeDouyinSignature(e){console.log("%c开始分析抖音签名参数","color: #ff9900; font-weight: bold;");try{if(!e.includes("?")){console.error("URL格式错误，无法解析签名参数:",e);return}const t=e.substring(e.indexOf("?")+1),o=new URLSearchParams(t),s=o.get("client_key"),i=o.get("nonce_str"),n=o.get("timestamp"),r=o.get("signature");console.log("%c抖音签名参数详情","color: blue; font-weight: bold; font-size: 14px;"),console.table({client_key:{value:s,length:(s==null?void 0:s.length)||0},nonce_str:{value:i,length:(i==null?void 0:i.length)||0},timestamp:{value:n,length:(n==null?void 0:n.length)||0,parsed:n?new Date(parseInt(n)*1e3).toLocaleString():"无效时间戳"},signature:{value:r,length:(r==null?void 0:r.length)||0}});const a=s&&i&&n&&r;if(console.log("%c签名参数完整性检查: "+(a?"完整":"不完整"),`color: ${a?"green":"red"}; font-weight: bold; font-size: 14px;`),n){const u=parseInt(n),d=new Date(u*1e3),g=new Date,h=Math.abs((g.getTime()-d.getTime())/1e3);console.log("%c时间戳检查","color: blue; font-weight: bold;",{当前时间:g.toLocaleString(),签名时间:d.toLocaleString(),相差秒数:h.toFixed(0),是否在有效期内:h<300?"有效":"已过期"})}console.log("%c所有URL参数","color: purple; font-weight: bold;");const c={};for(const[u,d]of o.entries())c[u]=d;console.table(c)}catch(t){console.error("分析抖音签名参数失败:",t)}},showConfirm(e,t,o){this.confirmDialogTitle=e,this.confirmDialogMessage=t,this.confirmDialogCallback=o,this.showConfirmDialog=!0},handleConfirm(){this.confirmDialogCallback&&this.confirmDialogCallback(),this.showConfirmDialog=!1},handleCancel(){this.showConfirmDialog=!1},discardNote(){this.showConfirm("确认弃用","确定要将此笔记标记为弃用吗？此操作无法撤销。",this.performDiscard)},async performDiscard(){try{this.showError("正在处理...","#ff9900");const e=`${this.API_DOMAIN}/xhs-auto/notes/${this.postData.id}/discard`;console.log("调用弃用API:",e);const t=await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include"});if(!t.ok)throw t.status===401?new Error("认证失败，请尝试从主应用打开"):new Error(`操作失败: ${t.status} ${t.statusText}`);const o=await t.json();console.log("标记笔记为弃用结果:",o),this.showSuccess("笔记已标记为弃用"),this.updateLocalStatus()}catch(e){console.error("标记笔记为弃用失败:",e),this.showError(`操作失败: ${e.message||"未知错误"}`)}},updateLocalStatus(){if(this.postData){this.postData.isDiscarded=!0,this.showSuccess("笔记已标记为弃用");try{window.parent&&window.parent!==window&&(window.parent.postMessage({type:"NOTE_DISCARDED",noteId:this.postData.id},"*"),console.log("已通知父窗口笔记已弃用"))}catch(e){console.error("通知父窗口失败:",e)}}},getAuthToken(){const e=localStorage.getItem("token");if(e)return e;const t=document.cookie.split(";");for(const s of t){const[i,n]=s.trim().split("=");if(i==="token")return n}const o=this.getUrlParams();return o!=null&&o.token?o.token:null},openLinkUniversal(e,t="_blank"){if(!e){console.error("打开链接失败: URL为空");return}console.log("通用链接打开方法 - 尝试打开链接:",e);const o=/Android/i.test(navigator.userAgent),s=/iPhone|iPad|iPod/i.test(navigator.userAgent);try{if(o){console.log("检测到安卓设备，使用多种方式尝试打开");try{const n=document.createElement("iframe");n.style.display="none",n.style.width="0",n.style.height="0",n.style.border="0",n.src=e,document.body.appendChild(n),setTimeout(()=>{document.body.contains(n)&&document.body.removeChild(n)},1e3)}catch(n){console.error("iframe方式打开链接失败:",n)}try{setTimeout(()=>{const n=document.createElement("a");n.setAttribute("href",e),n.setAttribute("target",t),n.style.display="none",document.body.appendChild(n);const r=document.createEvent("MouseEvents");r.initEvent("click",!0,!0),n.dispatchEvent(r),setTimeout(()=>{document.body.contains(n)&&document.body.removeChild(n)},500)},100)}catch(n){console.error("a标签方式打开链接失败:",n)}try{setTimeout(()=>{const n=window.open(e,t);(!n||n.closed||typeof n.closed>"u")&&console.log("window.open方法被阻止，尝试其他方式")},200)}catch(n){console.error("window.open方式打开链接失败:",n)}try{setTimeout(()=>{t==="_self"?window.location.href=e:window.open(e,"_blank")||(console.log("尝试使用location.replace作为最后手段"),this.showError("即将打开新页面...","#3498db"),setTimeout(()=>{window.location.href=e},1e3))},300)}catch(n){console.error("location方式打开链接失败:",n)}return}if(s){try{window.open(e,t)}catch(n){console.error("iOS打开链接失败:",n),setTimeout(()=>window.location.href=e,100)}return}const i=window.open(e,t);(!i||i.closed||typeof i.closed>"u")&&(console.log("window.open被阻止，尝试其他方式打开"),setTimeout(()=>{const n=document.createElement("a");n.href=e,n.target=t,n.style.display="none",document.body.appendChild(n),n.click(),document.body.removeChild(n)},100))}catch(i){console.error("打开链接失败:",i),this.showError("打开链接失败，请手动复制链接")}}}});const m=e=>(F("data-v-6e73e3d5"),e=e(),L(),e),P={key:0,class:"discarded-status"},U=m(()=>l("div",{class:"discarded-icon"},"⛔",-1)),M=m(()=>l("div",{class:"discarded-text"},"笔记已弃用",-1)),X=[U,M],q={key:1,class:"loading-container"},O={class:"loading-wrapper"},V={class:"loading-spinner"},R=m(()=>l("div",{class:"spinner-inner"},null,-1)),z={class:"spinner-text"},Y={class:"loading-progress-bar"},j={class:"loading-stage"},H=m(()=>l("div",{class:"loading-tips"},"小红书笔记精彩内容即将呈现",-1)),W={key:2,class:"confirm-dialog-container"},K={class:"confirm-dialog"},J={class:"confirm-dialog-header"},Q={class:"confirm-dialog-body"},G={class:"confirm-dialog-message"},Z={class:"confirm-dialog-actions"},ee={key:3,class:"desktop-modal-container"},te={class:"desktop-modal"},oe={class:"desktop-modal-header"},se=m(()=>l("h3",null,"访问提示",-1)),ne={class:"desktop-modal-body"},ie=m(()=>l("div",{class:"desktop-modal-icon"},"📱",-1)),re=m(()=>l("h4",null,"检测到您正在使用电脑端访问",-1)),ae=m(()=>l("p",null,"小红书\\抖音笔记分享功能仅支持在手机端使用",-1)),le=m(()=>l("p",{class:"desktop-modal-tips"},"您可以扫描下方二维码在手机上打开，或者继续在电脑上浏览笔记内容",-1)),de={class:"desktop-modal-qrcode"},ce=["src"],ue=m(()=>l("p",{class:"qrcode-tip"},"扫描二维码在手机上查看",-1)),he={class:"desktop-modal-actions"},ge={key:4,class:"scrollable-container"},pe={class:"floating-status-container"},fe={key:0,class:"floating-status xhs"},me=m(()=>l("div",{class:"status-icon"},"✓",-1)),ye=m(()=>l("div",{class:"status-text"},"已在小红书发布",-1)),be=[me,ye],we={key:1,class:"floating-status douyin"},ve=m(()=>l("div",{class:"status-icon"},"✓",-1)),_e=m(()=>l("div",{class:"status-text"},"已在抖音发布",-1)),De=[ve,_e],Ee={key:2,class:"floating-status debug"},Se=m(()=>l("div",{class:"status-icon"},"🛠️",-1)),Ce=m(()=>l("div",{class:"status-text"},"调试模式",-1)),xe=[Se,Ce],ke={key:3,class:"floating-status warning"},Be=m(()=>l("div",{class:"status-icon"},"!",-1)),Ie=m(()=>l("div",{class:"status-text"},"已被他人分享",-1)),Ae=[Be,Ie],Fe={key:4,class:"floating-status error"},Le=m(()=>l("div",{class:"status-icon"},"!",-1)),Te=m(()=>l("div",{class:"status-text"},"抖音链接错误",-1)),$e=[Le,Te],Ne={key:0},Pe={key:0,class:"note-content"},Ue=m(()=>l("svg",{viewBox:"0 0 24 24",width:"24",height:"24",fill:"none",stroke:"currentColor","stroke-width":"2"},[l("path",{d:"M15 18l-6-6 6-6"})],-1)),Me=[Ue],Xe=m(()=>l("svg",{viewBox:"0 0 24 24",width:"24",height:"24",fill:"none",stroke:"currentColor","stroke-width":"2"},[l("path",{d:"M9 18l6-6-6-6"})],-1)),qe=[Xe],Oe=["src"],Ve={class:"slider-dots"},Re=["onClick"],ze=m(()=>l("span",{class:"dot-inner"},null,-1)),Ye=[ze],je={class:"image-counter"},He={key:1,class:"note-title"},We=["innerHTML"],Ke={key:1,class:"publish-notice"},Je=m(()=>l("div",{class:"publish-notice-container"},[l("div",{class:"publish-notice-icon"},"📱"),l("div",{class:"publish-notice-text"},"点击下方按钮分享到平台")],-1)),Qe=[Je],Ge={key:3,class:"wechat-tip"},Ze=T('<div class="wechat-tip-icon" data-v-6e73e3d5>📱</div><div class="wechat-tip-label" data-v-6e73e3d5><strong data-v-6e73e3d5>微信环境提示：</strong><br data-v-6e73e3d5> 点击分享按钮后，请在<strong data-v-6e73e3d5>浏览器中打开</strong>继续操作 </div><div class="wechat-tip-arrow" data-v-6e73e3d5><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#0077cc" stroke-width="2" data-v-6e73e3d5><path d="M18 15l-6-6-6 6" data-v-6e73e3d5></path></svg></div>',3),et=[Ze],tt={class:"button-group"},ot=["disabled"],st={key:0},nt={key:1},it=["disabled"];const rt={key:6,class:"mobile-console"},at={class:"badge"},lt={key:0,class:"filter-badge",title:"已启用过滤"},dt={class:"console-actions"},ct={class:"console-toggle-btn"},ut={key:0,class:"console-logs"},ht=m(()=>l("div",{class:"console-notice"}," 分享按钮在底部 ⬇️ ",-1)),gt={key:0,class:"console-empty"},pt=m(()=>l("div",{class:"empty-icon"},"📝",-1)),ft={class:"log-header"},mt={class:"log-type"},yt={class:"log-timestamp"},bt={class:"log-content"};function wt(e,t,o,s,i,n){var r,a;return p(),f("div",{class:E(["container",{"discarded-note":(r=e.postData)==null?void 0:r.isDiscarded}])},[(a=e.postData)!=null&&a.isDiscarded?(p(),f("div",P,X)):y("",!0),e.loading?(p(),f("div",q,[l("div",O,[l("div",V,[R,l("div",z,v(e.loadingProgress)+"%",1)]),l("div",Y,[l("div",{class:"progress-bar-fill",style:S({width:e.loadingProgress+"%"})},null,4)]),l("div",j,v(e.loadingStage),1),H])])):y("",!0),e.showConfirmDialog?(p(),f("div",W,[l("div",{class:"confirm-dialog-overlay",onClick:t[0]||(t[0]=(...d)=>e.handleCancel&&e.handleCancel(...d))}),l("div",K,[l("div",J,[l("h3",null,v(e.confirmDialogTitle),1),l("button",{class:"confirm-dialog-close",onClick:t[1]||(t[1]=(...d)=>e.handleCancel&&e.handleCancel(...d))},"×")]),l("div",Q,[l("p",G,v(e.confirmDialogMessage),1),l("div",Z,[l("button",{class:"confirm-dialog-btn confirm-btn",onClick:t[2]||(t[2]=(...d)=>e.handleConfirm&&e.handleConfirm(...d))}," 确认 "),l("button",{class:"confirm-dialog-btn cancel-btn",onClick:t[3]||(t[3]=(...d)=>e.handleCancel&&e.handleCancel(...d))}," 取消 ")])])])])):y("",!0),e.showDesktopModal&&!e.loading?(p(),f("div",ee,[l("div",{class:"desktop-modal-overlay",onClick:t[4]||(t[4]=(...d)=>e.closeDesktopModal&&e.closeDesktopModal(...d))}),l("div",te,[l("div",oe,[se,l("button",{class:"desktop-modal-close",onClick:t[5]||(t[5]=(...d)=>e.closeDesktopModal&&e.closeDesktopModal(...d))},"×")]),l("div",ne,[ie,re,ae,le,l("div",de,[l("img",{src:e.qrCodeUrl,alt:"页面二维码",class:"qrcode-image"},null,8,ce),ue]),l("div",he,[l("button",{class:"desktop-modal-btn continue-btn",onClick:t[6]||(t[6]=(...d)=>e.closeDesktopModal&&e.closeDesktopModal(...d))}," 继续查看笔记 ")])])])])):y("",!0),e.loading?y("",!0):(p(),f("div",ge,[l("div",pe,[e.isXhsUsed&&!e.isDebug?(p(),f("div",fe,be)):y("",!0),e.isDouyinUsed&&!e.isDebug?(p(),f("div",we,De)):y("",!0),e.isDebug?(p(),f("div",Ee,xe)):y("",!0),e.noteSharedByOthers?(p(),f("div",ke,Ae)):y("",!0),e.douyinSchemaError?(p(),f("div",Fe,$e)):y("",!0)]),e.hideNoteContent?(p(),f("div",Ke,Qe)):(p(),f("div",Ne,[e.postData?(p(),f("div",Pe,[e.postData.images&&e.postData.images.length>0?(p(),f("div",{class:"image-slider",ref:"imageSlider",key:`slider-${e.postData.id}`},[l("div",{class:"slider-nav-button prev-button",ref:"prevButton",onClick:t[7]||(t[7]=d=>e.slideImage(-1))},Me,512),l("div",{class:"slider-nav-button next-button",ref:"nextButton",onClick:t[8]||(t[8]=d=>e.slideImage(1))},qe,512),l("div",{class:"note-images",style:S({transform:`translateX(-${e.currentImageIndex*100}%)`}),ref:"noteImages"},[(p(!0),f(C,null,x(e.postData.images,(d,g)=>(p(),f("img",{key:`${g}-${d}`,src:d,onError:t[9]||(t[9]=(...h)=>e.handleImageError&&e.handleImageError(...h)),style:{width:"100%",userSelect:"none",pointerEvents:"auto"},draggable:"false"},null,40,Oe))),128))],4),l("div",Ve,[(p(!0),f(C,null,x(e.postData.images,(d,g)=>(p(),f("span",{key:`dot-${g}`,class:E({active:g===e.currentImageIndex}),onClick:h=>e.changeSlide(g)},Ye,10,Re))),128))]),l("div",je,v(e.currentImageIndex+1)+"/"+v(e.postData.images.length),1)])):y("",!0),e.postData.title?(p(),f("div",He,v(e.postData.title),1)):y("",!0),e.postData.content?(p(),f("div",{key:2,class:"note-text",innerHTML:e.postData.content.replace(/\\n/g,"<br>")},null,8,We)):y("",!0)])):y("",!0)])),e.error?(p(),f("div",{key:2,id:"error",class:"error",style:S({color:e.errorColor})},v(e.error),5)):y("",!0),e.isWechatAndroid?(p(),f("div",Ge,et)):y("",!0)])),l("div",tt,[e.showShareButton||e.showDouyinShareButton||e.currentIdentifier&&e.urlHasIdentifier?(p(),f("div",{key:0,class:E(["buttons-row",{"share-buttons-only":e.showShareButton&&e.showDouyinShareButton&&!(e.currentIdentifier&&e.urlHasIdentifier),"has-next-button":e.currentIdentifier&&e.urlHasIdentifier}])},[e.showShareButton?(p(),f("button",{key:0,id:"shareButton",class:"share-button xhs-button",onClick:t[10]||(t[10]=(...d)=>e.shareToXhs&&e.shareToXhs(...d))}," 分享到小红书 ")):y("",!0),e.showDouyinShareButton?(p(),f("button",{key:1,id:"douyinShareButton",class:"share-button douyin-button",disabled:e.douyinSchemaLoading,onClick:t[11]||(t[11]=(...d)=>e.shareToDouyin&&e.shareToDouyin(...d))},[e.douyinSchemaLoading?(p(),f("span",st,"获取链接中...")):(p(),f("span",nt,"分享到抖音"))],8,ot)):y("",!0),e.currentIdentifier&&e.urlHasIdentifier?(p(),f("button",{key:2,id:"nextNoteButton",class:"next-note-button",disabled:e.nextButtonDisabled,onClick:t[12]||(t[12]=d=>e.loadNextNote(!0))}," 下一篇笔记 ",8,it)):y("",!0)],2)):y("",!0)]),(e.isDebug&&e.loading,y("",!0)),e.isDebug&&!e.loading?(p(),f("div",rt,[l("div",{class:"console-header",onClick:t[20]||(t[20]=(...d)=>e.toggleDebugLogExpanded&&e.toggleDebugLogExpanded(...d))},[l("h3",null,[k("📱 移动端控制台 "),l("span",at,v(e.consoleLogs.length),1),e.filterEnabled?(p(),f("span",lt," 🔍 已过滤"+v(e.filteredLogCount)+"条 ",1)):y("",!0)]),l("div",dt,[l("button",{onClick:t[18]||(t[18]=B((...d)=>e.toggleFilter&&e.toggleFilter(...d),["stop"])),class:E(["console-filter-btn",{"filter-active":e.filterEnabled}])},v(e.filterEnabled?"🔍开":"🔍关"),3),l("button",{onClick:t[19]||(t[19]=B((...d)=>e.clearConsoleLogs&&e.clearConsoleLogs(...d),["stop"])),class:"console-clear-btn"}," 🗑️ 清除 "),l("button",ct,v(e.debugLogExpanded?"🔽":"🔼"),1)])]),e.debugLogExpanded?(p(),f("div",ut,[ht,e.consoleLogs.length===0?(p(),f("div",gt,[pt,k(" 暂无日志记录，操作页面将显示日志 ")])):y("",!0),(p(!0),f(C,null,x(e.consoleLogs,(d,g)=>(p(),f("div",{key:g,class:E(["console-log-entry",{"log-error":d.type==="error","log-warn":d.type==="warn","log-info":d.type==="info","log-log":d.type==="log"}])},[l("div",ft,[l("span",mt,v(d.type==="error"?"❌":d.type==="warn"?"⚠️":d.type==="info"?"ℹ️":"📄"),1),l("span",yt,v(d.timestamp),1)]),l("div",bt,v(d.message),1)],2))),128))])):y("",!0)])):y("",!0)],2)}const Ct=$(N,[["render",wt],["__scopeId","data-v-6e73e3d5"]]);export{Ct as default};
