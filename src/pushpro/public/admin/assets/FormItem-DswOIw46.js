
/**
 * 由 Fantastic-admin 提供技术支持
 * Powered by Fantastic-admin
 * https://fantastic-admin.github.io
 */

import{a6 as K,ae as $e,M as ue,a3 as Pe,aw as ze,ax as $,aJ as y,az as N,a5 as me,d as ge,aA as be,aB as ee,r as V,ad as ne,U as p,bd as re,n as h,bx as he,bA as _e,ay as X,aj as Z,bt as le,bB as Ce,a as Me,aC as Ie,aI as Le,aN as Fe,bC as oe,aE as L,bw as se}from"./index-CnisIzlN.js";import{k as te}from"./use-message-DYMqPvJU.js";function Ae(t,e,r){var n;const c=K(t,null);if(c===null)return;const o=(n=$e())===null||n===void 0?void 0:n.proxy;ue(r,s),s(r.value),Pe(()=>{s(void 0,r.value)});function s(i,a){if(!c)return;const d=c[e];a!==void 0&&g(d,a),i!==void 0&&f(d,i)}function g(i,a){i[a]||(i[a]=[]),i[a].splice(i[a].findIndex(d=>d===o),1)}function f(i,a){i[a]||(i[a]=[]),~i[a].findIndex(d=>d===o)||i[a].push(o)}}const We={feedbackPadding:"4px 0 0 2px",feedbackHeightSmall:"24px",feedbackHeightMedium:"24px",feedbackHeightLarge:"26px",feedbackFontSizeSmall:"13px",feedbackFontSizeMedium:"14px",feedbackFontSizeLarge:"14px",labelFontSizeLeftSmall:"14px",labelFontSizeLeftMedium:"14px",labelFontSizeLeftLarge:"15px",labelFontSizeTopSmall:"13px",labelFontSizeTopMedium:"14px",labelFontSizeTopLarge:"14px",labelHeightSmall:"24px",labelHeightMedium:"26px",labelHeightLarge:"28px",labelPaddingVertical:"0 0 6px 2px",labelPaddingHorizontal:"0 12px 0 0",labelTextAlignVertical:"left",labelTextAlignHorizontal:"right",labelFontWeight:"400"},je=t=>{const{heightSmall:e,heightMedium:r,heightLarge:n,textColor1:c,errorColor:o,warningColor:s,lineHeight:g,textColor3:f}=t;return Object.assign(Object.assign({},We),{blankHeightSmall:e,blankHeightMedium:r,blankHeightLarge:n,lineHeight:g,labelTextColor:c,asteriskColor:o,feedbackTextColorError:o,feedbackTextColorWarning:s,feedbackTextColor:f})},ve={name:"Form",common:ze,self:je},Ve=$("form",[y("inline",`
 width: 100%;
 display: inline-flex;
 align-items: flex-start;
 align-content: space-around;
 `,[$("form-item",{width:"auto",marginRight:"18px"},[N("&:last-child",{marginRight:0})])])]),U=me("n-form"),pe=me("n-form-item-insts");var qe=function(t,e,r,n){function c(o){return o instanceof r?o:new r(function(s){s(o)})}return new(r||(r=Promise))(function(o,s){function g(a){try{i(n.next(a))}catch(d){s(d)}}function f(a){try{i(n.throw(a))}catch(d){s(d)}}function i(a){a.done?o(a.value):c(a.value).then(g,f)}i((n=n.apply(t,e||[])).next())})};const Ee=Object.assign(Object.assign({},ee.props),{inline:Boolean,labelWidth:[Number,String],labelAlign:String,labelPlacement:{type:String,default:"top"},model:{type:Object,default:()=>{}},rules:Object,disabled:Boolean,size:String,showRequireMark:{type:Boolean,default:void 0},requireMarkPlacement:String,showFeedback:{type:Boolean,default:!0},onSubmit:{type:Function,default:t=>{t.preventDefault()}},showLabel:{type:Boolean,default:void 0},validateMessages:Object}),Je=ge({name:"Form",props:Ee,setup(t){const{mergedClsPrefixRef:e}=be(t);ee("Form","-form",Ve,ve,t,e);const r={},n=V(void 0),c=f=>{const i=n.value;(i===void 0||f>=i)&&(n.value=f)};function o(f,i=()=>!0){return qe(this,void 0,void 0,function*(){return yield new Promise((a,d)=>{const k=[];for(const P of re(r)){const l=r[P];for(const x of l)x.path&&k.push(x.internalValidate(null,i))}Promise.all(k).then(P=>{const l=P.some(C=>!C.valid),x=[],F=[];P.forEach(C=>{var M,D;!((M=C.errors)===null||M===void 0)&&M.length&&x.push(C.errors),!((D=C.warnings)===null||D===void 0)&&D.length&&F.push(C.warnings)}),f&&f(x.length?x:void 0,{warnings:F.length?F:void 0}),l?d(x.length?x:void 0):a({warnings:F.length?F:void 0})})})})}function s(){for(const f of re(r)){const i=r[f];for(const a of i)a.restoreValidation()}}return ne(U,{props:t,maxChildLabelWidthRef:n,deriveMaxChildLabelWidth:c}),ne(pe,{formItems:r}),Object.assign({validate:o,restoreValidation:s},{mergedClsPrefix:e})},render(){const{mergedClsPrefix:t}=this;return p("form",{class:[`${t}-form`,this.inline&&`${t}-form--inline`],onSubmit:this.onSubmit},this.$slots)}});function Oe(t){const e=K(U,null);return{mergedSize:h(()=>t.size!==void 0?t.size:(e==null?void 0:e.props.size)!==void 0?e.props.size:"medium")}}function Te(t){const e=K(U,null),r=h(()=>{const{labelPlacement:l}=t;return l!==void 0?l:e!=null&&e.props.labelPlacement?e.props.labelPlacement:"top"}),n=h(()=>r.value==="left"&&(t.labelWidth==="auto"||(e==null?void 0:e.props.labelWidth)==="auto")),c=h(()=>{if(r.value==="top")return;const{labelWidth:l}=t;if(l!==void 0&&l!=="auto")return te(l);if(n.value){const x=e==null?void 0:e.maxChildLabelWidthRef.value;return x!==void 0?te(x):void 0}if((e==null?void 0:e.props.labelWidth)!==void 0)return te(e.props.labelWidth)}),o=h(()=>{const{labelAlign:l}=t;if(l)return l;if(e!=null&&e.props.labelAlign)return e.props.labelAlign}),s=h(()=>{var l;return[(l=t.labelProps)===null||l===void 0?void 0:l.style,t.labelStyle,{width:c.value}]}),g=h(()=>{const{showRequireMark:l}=t;return l!==void 0?l:e==null?void 0:e.props.showRequireMark}),f=h(()=>{const{requireMarkPlacement:l}=t;return l!==void 0?l:(e==null?void 0:e.props.requireMarkPlacement)||"right"}),i=V(!1),a=V(!1),d=h(()=>{const{validationStatus:l}=t;if(l!==void 0)return l;if(i.value)return"error";if(a.value)return"warning"}),k=h(()=>{const{showFeedback:l}=t;return l!==void 0?l:(e==null?void 0:e.props.showFeedback)!==void 0?e.props.showFeedback:!0}),P=h(()=>{const{showLabel:l}=t;return l!==void 0?l:(e==null?void 0:e.props.showLabel)!==void 0?e.props.showLabel:!0});return{validationErrored:i,validationWarned:a,mergedLabelStyle:s,mergedLabelPlacement:r,mergedLabelAlign:o,mergedShowRequireMark:g,mergedRequireMarkPlacement:f,mergedValidationStatus:d,mergedShowFeedback:k,mergedShowLabel:P,isAutoLabelWidth:n}}function He(t){const e=K(U,null),r=h(()=>{const{rulePath:s}=t;if(s!==void 0)return s;const{path:g}=t;if(g!==void 0)return g}),n=h(()=>{const s=[],{rule:g}=t;if(g!==void 0&&(Array.isArray(g)?s.push(...g):s.push(g)),e){const{rules:f}=e.props,{value:i}=r;if(f!==void 0&&i!==void 0){const a=he(f,i);a!==void 0&&(Array.isArray(a)?s.push(...a):s.push(a))}}return s}),c=h(()=>n.value.some(s=>s.required)),o=h(()=>c.value||t.required);return{mergedRules:n,mergedRequired:o}}const{cubicBezierEaseInOut:de}=_e;function Be({name:t="fade-down",fromOffset:e="-4px",enterDuration:r=".3s",leaveDuration:n=".3s",enterCubicBezier:c=de,leaveCubicBezier:o=de}={}){return[N(`&.${t}-transition-enter-from, &.${t}-transition-leave-to`,{opacity:0,transform:`translateY(${e})`}),N(`&.${t}-transition-enter-to, &.${t}-transition-leave-from`,{opacity:1,transform:"translateY(0)"}),N(`&.${t}-transition-leave-active`,{transition:`opacity ${n} ${o}, transform ${n} ${o}`}),N(`&.${t}-transition-enter-active`,{transition:`opacity ${r} ${c}, transform ${r} ${c}`})]}const Ne=$("form-item",`
 display: grid;
 line-height: var(--n-line-height);
`,[$("form-item-label",`
 grid-area: label;
 align-items: center;
 line-height: 1.25;
 text-align: var(--n-label-text-align);
 font-size: var(--n-label-font-size);
 min-height: var(--n-label-height);
 padding: var(--n-label-padding);
 color: var(--n-label-text-color);
 transition: color .3s var(--n-bezier);
 box-sizing: border-box;
 font-weight: var(--n-label-font-weight);
 `,[X("asterisk",`
 white-space: nowrap;
 user-select: none;
 -webkit-user-select: none;
 color: var(--n-asterisk-color);
 transition: color .3s var(--n-bezier);
 `),X("asterisk-placeholder",`
 grid-area: mark;
 user-select: none;
 -webkit-user-select: none;
 visibility: hidden; 
 `)]),$("form-item-blank",`
 grid-area: blank;
 min-height: var(--n-blank-height);
 `),y("auto-label-width",[$("form-item-label","white-space: nowrap;")]),y("left-labelled",`
 grid-template-areas:
 "label blank"
 "label feedback";
 grid-template-columns: auto minmax(0, 1fr);
 grid-template-rows: auto 1fr;
 align-items: flex-start;
 `,[$("form-item-label",`
 display: grid;
 grid-template-columns: 1fr auto;
 min-height: var(--n-blank-height);
 height: auto;
 box-sizing: border-box;
 flex-shrink: 0;
 flex-grow: 0;
 `,[y("reverse-columns-space",`
 grid-template-columns: auto 1fr;
 `),y("left-mark",`
 grid-template-areas:
 "mark text"
 ". text";
 `),y("right-mark",`
 grid-template-areas: 
 "text mark"
 "text .";
 `),y("right-hanging-mark",`
 grid-template-areas: 
 "text mark"
 "text .";
 `),X("text",`
 grid-area: text; 
 `),X("asterisk",`
 grid-area: mark; 
 align-self: end;
 `)])]),y("top-labelled",`
 grid-template-areas:
 "label"
 "blank"
 "feedback";
 grid-template-rows: minmax(var(--n-label-height), auto) 1fr;
 grid-template-columns: minmax(0, 100%);
 `,[y("no-label",`
 grid-template-areas:
 "blank"
 "feedback";
 grid-template-rows: 1fr;
 `),$("form-item-label",`
 display: flex;
 align-items: flex-start;
 justify-content: var(--n-label-text-align);
 `)]),$("form-item-blank",`
 box-sizing: border-box;
 display: flex;
 align-items: center;
 position: relative;
 `),$("form-item-feedback-wrapper",`
 grid-area: feedback;
 box-sizing: border-box;
 min-height: var(--n-feedback-height);
 font-size: var(--n-feedback-font-size);
 line-height: 1.25;
 transform-origin: top left;
 `,[N("&:not(:empty)",`
 padding: var(--n-feedback-padding);
 `),$("form-item-feedback",{transition:"color .3s var(--n-bezier)",color:"var(--n-feedback-text-color)"},[y("warning",{color:"var(--n-feedback-text-color-warning)"}),y("error",{color:"var(--n-feedback-text-color-error)"}),Be({fromOffset:"-3px",enterDuration:".3s",leaveDuration:".2s"})])])]);var fe=function(t,e,r,n){function c(o){return o instanceof r?o:new r(function(s){s(o)})}return new(r||(r=Promise))(function(o,s){function g(a){try{i(n.next(a))}catch(d){s(d)}}function f(a){try{i(n.throw(a))}catch(d){s(d)}}function i(a){a.done?o(a.value):c(a.value).then(g,f)}i((n=n.apply(t,e||[])).next())})};const De=Object.assign(Object.assign({},ee.props),{label:String,labelWidth:[Number,String],labelStyle:[String,Object],labelAlign:String,labelPlacement:String,path:String,first:Boolean,rulePath:String,required:Boolean,showRequireMark:{type:Boolean,default:void 0},requireMarkPlacement:String,showFeedback:{type:Boolean,default:void 0},rule:[Object,Array],size:String,ignorePathChange:Boolean,validationStatus:String,feedback:String,showLabel:{type:Boolean,default:void 0},labelProps:Object});function ce(t,e){return(...r)=>{try{const n=t(...r);return!e&&(typeof n=="boolean"||n instanceof Error||Array.isArray(n))||n!=null&&n.then?n:(n===void 0||se("form-item/validate",`You return a ${typeof n} typed value in the validator method, which is not recommended. Please use `+(e?"`Promise`":"`boolean`, `Error` or `Promise`")+" typed value instead."),!0)}catch(n){se("form-item/validate","An error is catched in the validation, so the validation won't be done. Your callback in `validate` method of `n-form` or `n-form-item` won't be called in this validation."),console.error(n);return}}}const Ge=ge({name:"FormItem",props:De,setup(t){Ae(pe,"formItems",Z(t,"path"));const{mergedClsPrefixRef:e,inlineThemeDisabled:r}=be(t),n=K(U,null),c=Oe(t),o=Te(t),{validationErrored:s,validationWarned:g}=o,{mergedRequired:f,mergedRules:i}=He(t),{mergedSize:a}=c,{mergedLabelPlacement:d,mergedLabelAlign:k,mergedRequireMarkPlacement:P}=o,l=V([]),x=V(le()),F=n?Z(n.props,"disabled"):V(!1),C=ee("Form","-form-item",Ne,ve,t,e);ue(Z(t,"path"),()=>{t.ignorePathChange||M()});function M(){l.value=[],s.value=!1,g.value=!1,t.feedback&&(x.value=le())}function D(){q("blur")}function ke(){q("change")}function xe(){q("focus")}function we(){q("input")}function Re(u,S){return fe(this,void 0,void 0,function*(){let w,R,A,W;return typeof u=="string"?(w=u,R=S):u!==null&&typeof u=="object"&&(w=u.trigger,R=u.callback,A=u.shouldRuleBeApplied,W=u.options),yield new Promise((O,T)=>{q(w,A,W).then(({valid:H,errors:I,warnings:z})=>{H?(R&&R(void 0,{warnings:z}),O({warnings:z})):(R&&R(I,{warnings:z}),T(I))})})})}const q=(u=null,S=()=>!0,w={suppressWarning:!0})=>fe(this,void 0,void 0,function*(){const{path:R}=t;w?w.first||(w.first=t.first):w={};const{value:A}=i,W=n?he(n.props.model,R||""):void 0,O={},T={},H=(u?A.filter(m=>Array.isArray(m.trigger)?m.trigger.includes(u):m.trigger===u):A).filter(S).map((m,v)=>{const b=Object.assign({},m);if(b.validator&&(b.validator=ce(b.validator,!1)),b.asyncValidator&&(b.asyncValidator=ce(b.asyncValidator,!0)),b.renderMessage){const j=`__renderMessage__${v}`;T[j]=b.message,b.message=j,O[j]=b.renderMessage}return b}),I=H.filter(m=>m.level!=="warning"),z=H.filter(m=>m.level==="warning"),B=R??"__n_no_path__",J=new oe({[B]:I}),G=new oe({[B]:z}),{validateMessages:Y}=(n==null?void 0:n.props)||{};Y&&(J.messages(Y),G.messages(Y));const Q=m=>{l.value=m.map(v=>{const b=(v==null?void 0:v.message)||"";return{key:b,render:()=>b.startsWith("__renderMessage__")?O[b]():b}}),m.forEach(v=>{var b;!((b=v.message)===null||b===void 0)&&b.startsWith("__renderMessage__")&&(v.message=T[v.message])})},_={valid:!0,errors:void 0,warnings:void 0};if(I.length){const m=yield new Promise(v=>{J.validate({[B]:W},w,v)});m!=null&&m.length&&(s.value=!0,_.valid=!1,_.errors=m,Q(m))}if(z.length&&!_.errors){const m=yield new Promise(v=>{G.validate({[B]:W},w,v)});m!=null&&m.length&&(Q(m),g.value=!0,_.warnings=m)}return I.length+z.length>0&&!_.errors&&!_.warnings&&M(),_});ne(Ce,{path:Z(t,"path"),disabled:F,mergedSize:c.mergedSize,mergedValidationStatus:o.mergedValidationStatus,restoreValidation:M,handleContentBlur:D,handleContentChange:ke,handleContentFocus:xe,handleContentInput:we});const Se={validate:Re,restoreValidation:M,internalValidate:q},ae=V(null);Me(()=>{if(!o.isAutoLabelWidth.value)return;const u=ae.value;if(u!==null){const S=u.style.whiteSpace;u.style.whiteSpace="nowrap",u.style.width="",n==null||n.deriveMaxChildLabelWidth(Number(getComputedStyle(u).width.slice(0,-2))),u.style.whiteSpace=S}});const ie=h(()=>{var u;const{value:S}=a,{value:w}=d,R=w==="top"?"vertical":"horizontal",{common:{cubicBezierEaseInOut:A},self:{labelTextColor:W,asteriskColor:O,lineHeight:T,feedbackTextColor:H,feedbackTextColorWarning:I,feedbackTextColorError:z,feedbackPadding:B,labelFontWeight:J,[L("labelHeight",S)]:G,[L("blankHeight",S)]:Y,[L("feedbackFontSize",S)]:Q,[L("feedbackHeight",S)]:_,[L("labelPadding",R)]:m,[L("labelTextAlign",R)]:v,[L(L("labelFontSize",w),S)]:b}}=C.value;let j=(u=k.value)!==null&&u!==void 0?u:v;return w==="top"&&(j=j==="right"?"flex-end":"flex-start"),{"--n-bezier":A,"--n-line-height":T,"--n-blank-height":Y,"--n-label-font-size":b,"--n-label-text-align":j,"--n-label-height":G,"--n-label-padding":m,"--n-label-font-weight":J,"--n-asterisk-color":O,"--n-label-text-color":W,"--n-feedback-padding":B,"--n-feedback-font-size":Q,"--n-feedback-height":_,"--n-feedback-text-color":H,"--n-feedback-text-color-warning":I,"--n-feedback-text-color-error":z}}),E=r?Ie("form-item",h(()=>{var u;return`${a.value[0]}${d.value[0]}${((u=k.value)===null||u===void 0?void 0:u[0])||""}`}),ie,t):void 0,ye=h(()=>d.value==="left"&&P.value==="left"&&k.value==="left");return Object.assign(Object.assign(Object.assign(Object.assign({labelElementRef:ae,mergedClsPrefix:e,mergedRequired:f,feedbackId:x,renderExplains:l,reverseColSpace:ye},o),c),Se),{cssVars:r?void 0:ie,themeClass:E==null?void 0:E.themeClass,onRender:E==null?void 0:E.onRender})},render(){const{$slots:t,mergedClsPrefix:e,mergedShowLabel:r,mergedShowRequireMark:n,mergedRequireMarkPlacement:c,onRender:o}=this,s=n!==void 0?n:this.mergedRequired;o==null||o();const g=()=>{const f=this.$slots.label?this.$slots.label():this.label;if(!f)return null;const i=p("span",{class:`${e}-form-item-label__text`},f),a=s?p("span",{class:`${e}-form-item-label__asterisk`},c!=="left"?" *":"* "):c==="right-hanging"&&p("span",{class:`${e}-form-item-label__asterisk-placeholder`}," *"),{labelProps:d}=this;return p("label",Object.assign({},d,{class:[d==null?void 0:d.class,`${e}-form-item-label`,`${e}-form-item-label--${c}-mark`,this.reverseColSpace&&`${e}-form-item-label--reverse-columns-space`],style:this.mergedLabelStyle,ref:"labelElementRef"}),c==="left"?[a,i]:[i,a])};return p("div",{class:[`${e}-form-item`,this.themeClass,`${e}-form-item--${this.mergedSize}-size`,`${e}-form-item--${this.mergedLabelPlacement}-labelled`,this.isAutoLabelWidth&&`${e}-form-item--auto-label-width`,!r&&`${e}-form-item--no-label`],style:this.cssVars},r&&g(),p("div",{class:[`${e}-form-item-blank`,this.mergedValidationStatus&&`${e}-form-item-blank--${this.mergedValidationStatus}`]},t),this.mergedShowFeedback?p("div",{key:this.feedbackId,class:`${e}-form-item-feedback-wrapper`},p(Le,{name:"fade-down-transition",mode:"out-in"},{default:()=>{const{mergedValidationStatus:f}=this;return Fe(t.feedback,i=>{var a;const{feedback:d}=this,k=i||d?p("div",{key:"__feedback__",class:`${e}-form-item-feedback__line`},i||d):this.renderExplains.length?(a=this.renderExplains)===null||a===void 0?void 0:a.map(({key:P,render:l})=>p("div",{key:P,class:`${e}-form-item-feedback__line`},l())):null;return k?f==="warning"?p("div",{key:"controlled-warning",class:`${e}-form-item-feedback ${e}-form-item-feedback--warning`},k):f==="error"?p("div",{key:"controlled-error",class:`${e}-form-item-feedback ${e}-form-item-feedback--error`},k):f==="success"?p("div",{key:"controlled-success",class:`${e}-form-item-feedback ${e}-form-item-feedback--success`},k):p("div",{key:"controlled-default",class:`${e}-form-item-feedback`},k):null})}})):null)}});export{Je as N,Ge as a};
