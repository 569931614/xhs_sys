
/**
 * 由 Fantastic-admin 提供技术支持
 * Powered by Fantastic-admin
 * https://fantastic-admin.github.io
 */

import{aw as y,ax as g,aJ as d,az as l,aB as h,d as v,aA as b,n as a,aC as C,bw as z,U as m,aq as _}from"./index-CnisIzlN.js";import{k as $}from"./use-message-DYMqPvJU.js";const P=(e,t)=>{if(!e)return;const o=document.createElement("a");o.href=e,t!==void 0&&(o.download=t),document.body.appendChild(o),o.click(),document.body.removeChild(o)},w=e=>{const{textColorBase:t,opacity1:o,opacity2:s,opacity3:c,opacity4:n,opacity5:i}=e;return{color:t,opacity1Depth:o,opacity2Depth:s,opacity3Depth:c,opacity4Depth:n,opacity5Depth:i}},x={name:"Icon",common:y,self:w},D=g("icon",`
 height: 1em;
 width: 1em;
 line-height: 1em;
 text-align: center;
 display: inline-block;
 position: relative;
 fill: currentColor;
 transform: translateZ(0);
`,[d("color-transition",{transition:"color .3s var(--n-bezier)"}),d("depth",{color:"var(--n-color)"},[l("svg",{opacity:"var(--n-opacity)",transition:"opacity .3s var(--n-bezier)"})]),l("svg",{height:"1em",width:"1em"})]),R=Object.assign(Object.assign({},h.props),{depth:[String,Number],size:[Number,String],color:String,component:Object}),B=v({_n_icon__:!0,name:"Icon",inheritAttrs:!1,props:R,setup(e){const{mergedClsPrefixRef:t,inlineThemeDisabled:o}=b(e),s=h("Icon","-icon",D,x,e,t),c=a(()=>{const{depth:i}=e,{common:{cubicBezierEaseInOut:r},self:p}=s.value;if(i!==void 0){const{color:u,[`opacity${i}Depth`]:f}=p;return{"--n-bezier":r,"--n-color":u,"--n-opacity":f}}return{"--n-bezier":r,"--n-color":"","--n-opacity":""}}),n=o?C("icon",a(()=>`${e.depth||"d"}`),c,e):void 0;return{mergedClsPrefix:t,mergedStyle:a(()=>{const{size:i,color:r}=e;return{fontSize:$(i),color:r}}),cssVars:o?void 0:c,themeClass:n==null?void 0:n.themeClass,onRender:n==null?void 0:n.onRender}},render(){var e;const{$parent:t,depth:o,mergedClsPrefix:s,component:c,onRender:n,themeClass:i}=this;return!((e=t==null?void 0:t.$options)===null||e===void 0)&&e._n_icon__&&z("icon","don't wrap `n-icon` inside `n-icon`"),n==null||n(),m("i",_(this.$attrs,{role:"img",class:[`${s}-icon`,i,{[`${s}-icon--depth`]:o,[`${s}-icon--color-transition`]:o!==void 0}],style:[this.cssVars,this.mergedStyle]}),c?m(c):this.$slots)}});export{B as N,P as d};
