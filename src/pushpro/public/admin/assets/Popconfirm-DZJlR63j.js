
/**
 * 由 Fantastic-admin 提供技术支持
 * Powered by Fantastic-admin
 * https://fantastic-admin.github.io
 */

import{p as N,z as g,l as w,o as B}from"./use-message-DYMqPvJU.js";import{aF as O,aw as R,bu as I,a5 as $,d as y,aA as z,a6 as F,n as f,aC as U,aj as h,aQ as P,U as a,aN as L,bd as V,R as C,aD as E,bF as K,ax as x,ay as m,az as b,aB as S,r as q,ad as D,b1 as M,be as W,b2 as T}from"./index-CnisIzlN.js";const A={iconSize:"22px"},H=e=>{const{fontSize:i,warningColor:s}=e;return Object.assign(Object.assign({},A),{fontSize:i,iconColor:s})},Q=O({name:"Popconfirm",common:R,peers:{Button:I,Popover:N},self:H}),_=$("n-popconfirm"),j={positiveText:String,negativeText:String,showIcon:{type:Boolean,default:!0},onPositiveClick:{type:Function,required:!0},onNegativeClick:{type:Function,required:!0}},k=V(j),G=y({name:"NPopconfirmPanel",props:j,setup(e){const{localeRef:i}=g("Popconfirm"),{inlineThemeDisabled:s}=z(),{mergedClsPrefixRef:n,mergedThemeRef:v,props:r}=F(_),u=f(()=>{const{common:{cubicBezierEaseInOut:o},self:{fontSize:l,iconSize:c,iconColor:d}}=v.value;return{"--n-bezier":o,"--n-font-size":l,"--n-icon-size":c,"--n-icon-color":d}}),t=s?U("popconfirm-panel",void 0,u,r):void 0;return Object.assign(Object.assign({},g("Popconfirm")),{mergedClsPrefix:n,cssVars:s?void 0:u,localizedPositiveText:f(()=>e.positiveText||i.value.positiveText),localizedNegativeText:f(()=>e.negativeText||i.value.negativeText),positiveButtonProps:h(r,"positiveButtonProps"),negativeButtonProps:h(r,"negativeButtonProps"),handlePositiveClick(o){e.onPositiveClick(o)},handleNegativeClick(o){e.onNegativeClick(o)},themeClass:t==null?void 0:t.themeClass,onRender:t==null?void 0:t.onRender})},render(){var e;const{mergedClsPrefix:i,showIcon:s,$slots:n}=this,v=P(n.action,()=>this.negativeText===null&&this.positiveText===null?[]:[this.negativeText!==null&&a(C,Object.assign({size:"small",onClick:this.handleNegativeClick},this.negativeButtonProps),{default:()=>this.localizedNegativeText}),this.positiveText!==null&&a(C,Object.assign({size:"small",type:"primary",onClick:this.handlePositiveClick},this.positiveButtonProps),{default:()=>this.localizedPositiveText})]);return(e=this.onRender)===null||e===void 0||e.call(this),a("div",{class:[`${i}-popconfirm__panel`,this.themeClass],style:this.cssVars},L(n.default,r=>s||r?a("div",{class:`${i}-popconfirm__body`},s?a("div",{class:`${i}-popconfirm__icon`},P(n.icon,()=>[a(E,{clsPrefix:i},{default:()=>a(K,null)})])):null,r):null),v?a("div",{class:[`${i}-popconfirm__action`]},v):null)}}),J=x("popconfirm",[m("body",`
 font-size: var(--n-font-size);
 display: flex;
 align-items: center;
 flex-wrap: nowrap;
 position: relative;
 `,[m("icon",`
 display: flex;
 font-size: var(--n-icon-size);
 color: var(--n-icon-color);
 transition: color .3s var(--n-bezier);
 margin: 0 8px 0 0;
 `)]),m("action",`
 display: flex;
 justify-content: flex-end;
 `,[b("&:not(:first-child)","margin-top: 8px"),x("button",[b("&:not(:last-child)","margin-right: 8px;")])])]),X=Object.assign(Object.assign(Object.assign({},S.props),B),{positiveText:String,negativeText:String,showIcon:{type:Boolean,default:!0},trigger:{type:String,default:"click"},positiveButtonProps:Object,negativeButtonProps:Object,onPositiveClick:Function,onNegativeClick:Function}),ee=y({name:"Popconfirm",props:X,__popover__:!0,setup(e){const{mergedClsPrefixRef:i}=z(),s=S("Popconfirm","-popconfirm",J,Q,e,i),n=q(null);function v(t){var o;if(!(!((o=n.value)===null||o===void 0)&&o.getMergedShow()))return;const{onPositiveClick:l,"onUpdate:show":c}=e;Promise.resolve(l?l(t):!0).then(d=>{var p;d!==!1&&((p=n.value)===null||p===void 0||p.setShow(!1),c&&T(c,!1))})}function r(t){var o;if(!(!((o=n.value)===null||o===void 0)&&o.getMergedShow()))return;const{onNegativeClick:l,"onUpdate:show":c}=e;Promise.resolve(l?l(t):!0).then(d=>{var p;d!==!1&&((p=n.value)===null||p===void 0||p.setShow(!1),c&&T(c,!1))})}return D(_,{mergedThemeRef:s,mergedClsPrefixRef:i,props:e}),{setShow(t){var o;(o=n.value)===null||o===void 0||o.setShow(t)},syncPosition(){var t;(t=n.value)===null||t===void 0||t.syncPosition()},mergedTheme:s,popoverInstRef:n,handlePositiveClick:v,handleNegativeClick:r}},render(){const{$slots:e,$props:i,mergedTheme:s}=this;return a(w,W(i,k,{theme:s.peers.Popover,themeOverrides:s.peerOverrides.Popover,internalExtraClass:["popconfirm"],ref:"popoverInstRef"}),{trigger:e.activator||e.trigger,default:()=>{const n=M(i,k);return a(G,Object.assign(Object.assign({},n),{onPositiveClick:this.handlePositiveClick,onNegativeClick:this.handleNegativeClick}),e)}})}});export{ee as N};
