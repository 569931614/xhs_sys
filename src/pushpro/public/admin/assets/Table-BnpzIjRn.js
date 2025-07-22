
/**
 * 由 Fantastic-admin 提供技术支持
 * Powered by Fantastic-admin
 * https://fantastic-admin.github.io
 */

import{aw as ee,b3 as be,bg as C,ax as W,ay as r,b6 as Z,az as t,aJ as u,aK as Q,d as oe,aA as re,aB as L,bc as ge,r as Y,aj as ve,n as V,aC as te,aX as J,U as s,aN as R,aE as x,as as q,ap as y,b8 as fe,aO as pe,b2 as G,br as me,bs as xe,aM as we}from"./index-CnisIzlN.js";import{f as Ce}from"./use-message-DYMqPvJU.js";const ye={buttonHeightSmall:"14px",buttonHeightMedium:"18px",buttonHeightLarge:"22px",buttonWidthSmall:"14px",buttonWidthMedium:"18px",buttonWidthLarge:"22px",buttonWidthPressedSmall:"20px",buttonWidthPressedMedium:"24px",buttonWidthPressedLarge:"28px",railHeightSmall:"18px",railHeightMedium:"22px",railHeightLarge:"26px",railWidthSmall:"32px",railWidthMedium:"40px",railWidthLarge:"48px"},ke=e=>{const{primaryColor:a,opacityDisabled:d,borderRadius:i,textColor3:l}=e;return Object.assign(Object.assign({},ye),{iconColor:l,textColor:"white",loadingColor:a,opacityDisabled:d,railColor:"rgba(0, 0, 0, .14)",railColorActive:a,buttonBoxShadow:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",buttonColor:"#FFF",railBorderRadiusSmall:i,railBorderRadiusMedium:i,railBorderRadiusLarge:i,buttonBorderRadiusSmall:i,buttonBorderRadiusMedium:i,buttonBorderRadiusLarge:i,boxShadowFocus:`0 0 0 2px ${be(a,{alpha:.2})}`})},Se={name:"Switch",common:ee,self:ke},ze={thPaddingSmall:"6px",thPaddingMedium:"12px",thPaddingLarge:"12px",tdPaddingSmall:"6px",tdPaddingMedium:"12px",tdPaddingLarge:"12px"},Re=e=>{const{dividerColor:a,cardColor:d,modalColor:i,popoverColor:l,tableHeaderColor:v,tableColorStriped:c,textColor1:h,textColor2:p,borderRadius:f,fontWeightStrong:w,lineHeight:m,fontSizeSmall:n,fontSizeMedium:b,fontSizeLarge:g}=e;return Object.assign(Object.assign({},ze),{fontSizeSmall:n,fontSizeMedium:b,fontSizeLarge:g,lineHeight:m,borderRadius:f,borderColor:C(d,a),borderColorModal:C(i,a),borderColorPopover:C(l,a),tdColor:d,tdColorModal:i,tdColorPopover:l,tdColorStriped:C(d,c),tdColorStripedModal:C(i,c),tdColorStripedPopover:C(l,c),thColor:C(d,v),thColorModal:C(i,v),thColorPopover:C(l,v),thTextColor:h,tdTextColor:p,thFontWeight:w})},Be={name:"Table",common:ee,self:Re},$e=W("switch",`
 height: var(--n-height);
 min-width: var(--n-width);
 vertical-align: middle;
 user-select: none;
 -webkit-user-select: none;
 display: inline-flex;
 outline: none;
 justify-content: center;
 align-items: center;
`,[r("children-placeholder",`
 height: var(--n-rail-height);
 display: flex;
 flex-direction: column;
 overflow: hidden;
 pointer-events: none;
 visibility: hidden;
 `),r("rail-placeholder",`
 display: flex;
 flex-wrap: none;
 `),r("button-placeholder",`
 width: calc(1.75 * var(--n-rail-height));
 height: var(--n-rail-height);
 `),W("base-loading",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 font-size: calc(var(--n-button-width) - 4px);
 color: var(--n-loading-color);
 transition: color .3s var(--n-bezier);
 `,[Z({left:"50%",top:"50%",originalTransform:"translateX(-50%) translateY(-50%)"})]),r("checked, unchecked",`
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 box-sizing: border-box;
 position: absolute;
 white-space: nowrap;
 top: 0;
 bottom: 0;
 display: flex;
 align-items: center;
 line-height: 1;
 `),r("checked",`
 right: 0;
 padding-right: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),r("unchecked",`
 left: 0;
 justify-content: flex-end;
 padding-left: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),t("&:focus",[r("rail",`
 box-shadow: var(--n-box-shadow-focus);
 `)]),u("round",[r("rail","border-radius: calc(var(--n-rail-height) / 2);",[r("button","border-radius: calc(var(--n-button-height) / 2);")])]),Q("disabled",[Q("icon",[u("rubber-band",[u("pressed",[r("rail",[r("button","max-width: var(--n-button-width-pressed);")])]),r("rail",[t("&:active",[r("button","max-width: var(--n-button-width-pressed);")])]),u("active",[u("pressed",[r("rail",[r("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])]),r("rail",[t("&:active",[r("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])])])])])]),u("active",[r("rail",[r("button","left: calc(100% - var(--n-button-width) - var(--n-offset))")])]),r("rail",`
 overflow: hidden;
 height: var(--n-rail-height);
 min-width: var(--n-rail-width);
 border-radius: var(--n-rail-border-radius);
 cursor: pointer;
 position: relative;
 transition:
 opacity .3s var(--n-bezier),
 background .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 background-color: var(--n-rail-color);
 `,[r("button-icon",`
 color: var(--n-icon-color);
 transition: color .3s var(--n-bezier);
 font-size: calc(var(--n-button-height) - 4px);
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 display: flex;
 justify-content: center;
 align-items: center;
 line-height: 1;
 `,[Z()]),r("button",`
 align-items: center; 
 top: var(--n-offset);
 left: var(--n-offset);
 height: var(--n-button-height);
 width: var(--n-button-width-pressed);
 max-width: var(--n-button-width);
 border-radius: var(--n-button-border-radius);
 background-color: var(--n-button-color);
 box-shadow: var(--n-button-box-shadow);
 box-sizing: border-box;
 cursor: inherit;
 content: "";
 position: absolute;
 transition:
 background-color .3s var(--n-bezier),
 left .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 max-width .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 `)]),u("active",[r("rail","background-color: var(--n-rail-color-active);")]),u("loading",[r("rail",`
 cursor: wait;
 `)]),u("disabled",[r("rail",`
 cursor: not-allowed;
 opacity: .5;
 `)])]),Pe=Object.assign(Object.assign({},L.props),{size:{type:String,default:"medium"},value:{type:[String,Number,Boolean],default:void 0},loading:Boolean,defaultValue:{type:[String,Number,Boolean],default:!1},disabled:{type:Boolean,default:void 0},round:{type:Boolean,default:!0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],checkedValue:{type:[String,Number,Boolean],default:!0},uncheckedValue:{type:[String,Number,Boolean],default:!1},railStyle:Function,rubberBand:{type:Boolean,default:!0},onChange:[Function,Array]});let T;const Te=oe({name:"Switch",props:Pe,setup(e){T===void 0&&(typeof CSS<"u"?typeof CSS.supports<"u"?T=CSS.supports("width","max(1px)"):T=!1:T=!0);const{mergedClsPrefixRef:a,inlineThemeDisabled:d}=re(e),i=L("Switch","-switch",$e,Se,e,a),l=ge(e),{mergedSizeRef:v,mergedDisabledRef:c}=l,h=Y(e.defaultValue),p=ve(e,"value"),f=Ce(p,h),w=V(()=>f.value===e.checkedValue),m=Y(!1),n=Y(!1),b=V(()=>{const{railStyle:o}=e;if(o)return o({focused:n.value,checked:w.value})});function g(o){const{"onUpdate:value":B,onChange:$,onUpdateValue:P}=e,{nTriggerFormInput:M,nTriggerFormChange:_}=l;B&&G(B,o),P&&G(P,o),$&&G($,o),h.value=o,M(),_()}function O(){const{nTriggerFormFocus:o}=l;o()}function j(){const{nTriggerFormBlur:o}=l;o()}function N(){e.loading||c.value||(f.value!==e.checkedValue?g(e.checkedValue):g(e.uncheckedValue))}function D(){n.value=!0,O()}function E(){n.value=!1,j(),m.value=!1}function K(o){e.loading||c.value||o.key===" "&&(f.value!==e.checkedValue?g(e.checkedValue):g(e.uncheckedValue),m.value=!1)}function U(o){e.loading||c.value||o.key===" "&&(o.preventDefault(),m.value=!0)}const H=V(()=>{const{value:o}=v,{self:{opacityDisabled:B,railColor:$,railColorActive:P,buttonBoxShadow:M,buttonColor:_,boxShadowFocus:ae,loadingColor:ne,textColor:ie,iconColor:le,[x("buttonHeight",o)]:S,[x("buttonWidth",o)]:de,[x("buttonWidthPressed",o)]:se,[x("railHeight",o)]:z,[x("railWidth",o)]:F,[x("railBorderRadius",o)]:ce,[x("buttonBorderRadius",o)]:he},common:{cubicBezierEaseInOut:ue}}=i.value;let A,I,X;return T?(A=`calc((${z} - ${S}) / 2)`,I=`max(${z}, ${S})`,X=`max(${F}, calc(${F} + ${S} - ${z}))`):(A=q((y(z)-y(S))/2),I=q(Math.max(y(z),y(S))),X=y(z)>y(S)?F:q(y(F)+y(S)-y(z))),{"--n-bezier":ue,"--n-button-border-radius":he,"--n-button-box-shadow":M,"--n-button-color":_,"--n-button-width":de,"--n-button-width-pressed":se,"--n-button-height":S,"--n-height":I,"--n-offset":A,"--n-opacity-disabled":B,"--n-rail-border-radius":ce,"--n-rail-color":$,"--n-rail-color-active":P,"--n-rail-height":z,"--n-rail-width":F,"--n-width":X,"--n-box-shadow-focus":ae,"--n-loading-color":ne,"--n-text-color":ie,"--n-icon-color":le}}),k=d?te("switch",V(()=>v.value[0]),H,e):void 0;return{handleClick:N,handleBlur:E,handleFocus:D,handleKeyup:K,handleKeydown:U,mergedRailStyle:b,pressed:m,mergedClsPrefix:a,mergedValue:f,checked:w,mergedDisabled:c,cssVars:d?void 0:H,themeClass:k==null?void 0:k.themeClass,onRender:k==null?void 0:k.onRender}},render(){const{mergedClsPrefix:e,mergedDisabled:a,checked:d,mergedRailStyle:i,onRender:l,$slots:v}=this;l==null||l();const{checked:c,unchecked:h,icon:p,"checked-icon":f,"unchecked-icon":w}=v,m=!(J(p)&&J(f)&&J(w));return s("div",{role:"switch","aria-checked":d,class:[`${e}-switch`,this.themeClass,m&&`${e}-switch--icon`,d&&`${e}-switch--active`,a&&`${e}-switch--disabled`,this.round&&`${e}-switch--round`,this.loading&&`${e}-switch--loading`,this.pressed&&`${e}-switch--pressed`,this.rubberBand&&`${e}-switch--rubber-band`],tabindex:this.mergedDisabled?void 0:0,style:this.cssVars,onClick:this.handleClick,onFocus:this.handleFocus,onBlur:this.handleBlur,onKeyup:this.handleKeyup,onKeydown:this.handleKeydown},s("div",{class:`${e}-switch__rail`,"aria-hidden":"true",style:i},R(c,n=>R(h,b=>n||b?s("div",{"aria-hidden":!0,class:`${e}-switch__children-placeholder`},s("div",{class:`${e}-switch__rail-placeholder`},s("div",{class:`${e}-switch__button-placeholder`}),n),s("div",{class:`${e}-switch__rail-placeholder`},s("div",{class:`${e}-switch__button-placeholder`}),b)):null)),s("div",{class:`${e}-switch__button`},R(p,n=>R(f,b=>R(w,g=>s(fe,null,{default:()=>this.loading?s(pe,{key:"loading",clsPrefix:e,strokeWidth:20}):this.checked&&(b||n)?s("div",{class:`${e}-switch__button-icon`,key:b?"checked-icon":"icon"},b||n):!this.checked&&(g||n)?s("div",{class:`${e}-switch__button-icon`,key:g?"unchecked-icon":"icon"},g||n):null})))),R(c,n=>n&&s("div",{key:"checked",class:`${e}-switch__checked`},n)),R(h,n=>n&&s("div",{key:"unchecked",class:`${e}-switch__unchecked`},n)))))}}),Ve=t([W("table",`
 font-size: var(--n-font-size);
 font-variant-numeric: tabular-nums;
 line-height: var(--n-line-height);
 width: 100%;
 border-radius: var(--n-border-radius) var(--n-border-radius) 0 0;
 text-align: left;
 border-collapse: separate;
 border-spacing: 0;
 overflow: hidden;
 background-color: var(--n-td-color);
 border-color: var(--n-merged-border-color);
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 --n-merged-border-color: var(--n-border-color);
 `,[t("th",`
 white-space: nowrap;
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 text-align: inherit;
 padding: var(--n-th-padding);
 vertical-align: inherit;
 text-transform: none;
 border: 0px solid var(--n-merged-border-color);
 font-weight: var(--n-th-font-weight);
 color: var(--n-th-text-color);
 background-color: var(--n-th-color);
 border-bottom: 1px solid var(--n-merged-border-color);
 border-right: 1px solid var(--n-merged-border-color);
 `,[t("&:last-child",`
 border-right: 0px solid var(--n-merged-border-color);
 `)]),t("td",`
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 padding: var(--n-td-padding);
 color: var(--n-td-text-color);
 background-color: var(--n-td-color);
 border: 0px solid var(--n-merged-border-color);
 border-right: 1px solid var(--n-merged-border-color);
 border-bottom: 1px solid var(--n-merged-border-color);
 `,[t("&:last-child",`
 border-right: 0px solid var(--n-merged-border-color);
 `)]),u("bordered",`
 border: 1px solid var(--n-merged-border-color);
 border-radius: var(--n-border-radius);
 `,[t("tr",[t("&:last-child",[t("td",`
 border-bottom: 0 solid var(--n-merged-border-color);
 `)])])]),u("single-line",[t("th",`
 border-right: 0px solid var(--n-merged-border-color);
 `),t("td",`
 border-right: 0px solid var(--n-merged-border-color);
 `)]),u("single-column",[t("tr",[t("&:not(:last-child)",[t("td",`
 border-bottom: 0px solid var(--n-merged-border-color);
 `)])])]),u("striped",[t("tr:nth-of-type(even)",[t("td","background-color: var(--n-td-color-striped)")])]),Q("bottom-bordered",[t("tr",[t("&:last-child",[t("td",`
 border-bottom: 0px solid var(--n-merged-border-color);
 `)])])])]),me(W("table",`
 background-color: var(--n-td-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `,[t("th",`
 background-color: var(--n-th-color-modal);
 `),t("td",`
 background-color: var(--n-td-color-modal);
 `)])),xe(W("table",`
 background-color: var(--n-td-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `,[t("th",`
 background-color: var(--n-th-color-popover);
 `),t("td",`
 background-color: var(--n-td-color-popover);
 `)]))]),Me=Object.assign(Object.assign({},L.props),{bordered:{type:Boolean,default:!0},bottomBordered:{type:Boolean,default:!0},singleLine:{type:Boolean,default:!0},striped:Boolean,singleColumn:Boolean,size:{type:String,default:"medium"}}),We=oe({name:"Table",props:Me,setup(e){const{mergedClsPrefixRef:a,inlineThemeDisabled:d,mergedRtlRef:i}=re(e),l=L("Table","-table",Ve,Be,e,a),v=we("Table",i,a),c=V(()=>{const{size:p}=e,{self:{borderColor:f,tdColor:w,tdColorModal:m,tdColorPopover:n,thColor:b,thColorModal:g,thColorPopover:O,thTextColor:j,tdTextColor:N,borderRadius:D,thFontWeight:E,lineHeight:K,borderColorModal:U,borderColorPopover:H,tdColorStriped:k,tdColorStripedModal:o,tdColorStripedPopover:B,[x("fontSize",p)]:$,[x("tdPadding",p)]:P,[x("thPadding",p)]:M},common:{cubicBezierEaseInOut:_}}=l.value;return{"--n-bezier":_,"--n-td-color":w,"--n-td-color-modal":m,"--n-td-color-popover":n,"--n-td-text-color":N,"--n-border-color":f,"--n-border-color-modal":U,"--n-border-color-popover":H,"--n-border-radius":D,"--n-font-size":$,"--n-th-color":b,"--n-th-color-modal":g,"--n-th-color-popover":O,"--n-th-font-weight":E,"--n-th-text-color":j,"--n-line-height":K,"--n-td-padding":P,"--n-th-padding":M,"--n-td-color-striped":k,"--n-td-color-striped-modal":o,"--n-td-color-striped-popover":B}}),h=d?te("table",V(()=>e.size[0]),c,e):void 0;return{rtlEnabled:v,mergedClsPrefix:a,cssVars:d?void 0:c,themeClass:h==null?void 0:h.themeClass,onRender:h==null?void 0:h.onRender}},render(){var e;const{mergedClsPrefix:a}=this;return(e=this.onRender)===null||e===void 0||e.call(this),s("table",{class:[`${a}-table`,this.themeClass,{[`${a}-table--rtl`]:this.rtlEnabled,[`${a}-table--bottom-bordered`]:this.bottomBordered,[`${a}-table--bordered`]:this.bordered,[`${a}-table--single-line`]:this.singleLine,[`${a}-table--single-column`]:this.singleColumn,[`${a}-table--striped`]:this.striped}],style:this.cssVars},this.$slots)}});export{We as N,Te as a};
