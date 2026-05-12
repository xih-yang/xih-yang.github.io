# 24、Opera9 对 SVG 支持情况 4
- 来源：https://ddkk.com/zhuanlan/other/svg/24.html
- 分类：SVG 教程
- 分组：教程目录
长久以来 ,Opera 对 SVG 总是提不起兴趣，不过从 Opera9 开始陆陆续续的支持了好多

> 不用详细的看，Opera 在中国的市场份额基本快可以忽略不计，所以你做的 SVG 大可放心在中国运行

## SVG DOM 接口支持情况

接口名
说明
是否支持

GetSVGDocument
HTML 中的 , 和  都支持该接口
Yes

SVGAElement

Yes

SVGAltGlyphDefElement

No

SVGAltGlyphElement

No

SVGAltGlyphItemElement

No

SVGAngle

Yes

SVGAnimateColorElement

Yes

SVGAnimateElement

Yes

SVGAnimateMotionElement

Yes

SVGAnimateTransformElement

Yes

SVGAnimatedAngle

Yes

SVGAnimatedBoolean

Yes

SVGAnimatedEnumeration

Yes

SVGAnimatedInteger
只支持 SVGAnimatedNumber
Yes

SVGAnimatedLength

Yes

SVGAnimatedLengthList

Yes

SVGAnimatedNumber

Yes

SVGAnimatedNumberList

Yes

SVGAnimatedPathData

Yes

SVGAnimatedPoints

Yes

SVGAnimatedPreserveAspectRatio

Yes

SVGAnimatedRect

Yes

SVGAnimatedString

Yes

SVGAnimatedTransformList

Yes

SVGAnimationElement

Yes

SVGCSSRule

No

SVGCircleElement

Yes

SVGClipPathElement

Yes

SVGColor
不支持 setColor() 方法
Yes

SVGColorProfileElement

No

SVGColorProfileRule

No

SVGComponentTransferFunctionElement

Yes

SVGCursorElement

No

SVGDefinitionSrcElement

Yes

SVGDefsElement

Yes

SVGDescElement

Yes

SVGDocument

Yes

SVGElement

Yes

SVGElementInstance

Yes

SVGElementInstanceList

Yes

SVGEllipseElement

Yes

SVGEvent

No

SVGExternalResourcesRequired

No

SVGFEBlendElement

Yes

SVGFEColorMatrixElement

Yes

SVGFEComponentTransferElement

Yes

SVGFECompositeElement

Yes

SVGFEConvolveMatrixElement
SVG 1.1 规范中添加了 in1 属性
Yes

SVGFEDiffuseLightingElement

Yes

SVGFEDisplacementMapElement

Yes

SVGFEDistantLightElement

Yes

SVGFEFloodElement

Yes

SVGFEFuncAElement

Yes

SVGFEFuncBElement

Yes

SVGFEFuncGElement

Yes

SVGFEFuncRElement

Yes

SVGFEGaussianBlurElement

Yes

SVGFEImageElement

Yes

SVGFEMergeElement

Yes

SVGFEMergeNdeElement

Yes

SVGFEMorphologyElement

Yes

SVGFEOffsetElement

Yes

SVGFEPointLightElement

Yes

SVGFESpecularLightingElement

Yes

SVGFESpotLightElement

Yes

SVGFETileElement

Yes

SVGFETurbulenceElement

Yes

SVGFilterElement

Yes

SVGFilterPrimitiveStandardAttributes

Yes

SVGFitToViewBox

Yes

SVGFontElement

Yes

SVGFontFaceElement

Yes

SVGFontFaceFormatElement

Yes

SVGFontFaceNameElement

Yes

SVGFontFaceSrcElement

Yes

SVGFontFaceUriElement

Yes

SVGForeigNbjectElement

Yes

SVGGElement

Yes

SVGGlyphElement

Yes

SVGGlyphRefElement

No

SVGGradientElement

Yes

SVGHKernElement

Yes

SVGICCColor
支持 N ICC 颜色
No

SVGImageElement

Yes

SVGLangSpace

No

SVGLength

Yes

SVGLengthList

Yes

SVGLineElement

Yes

SVGLinearGradientElement

Yes

SVGLocatable
支持 SVG Tiny 1.2 规范的 getScreenBBox() 方法
Yes

SVGMPathElement

Yes

SVGMarkerElement

Yes

SVGMaskElement

Yes

SVGMatrix
支持所有 SVG Tiny 1.2 规范定义的方法
Yes

SVGMetadataElement

Yes

SVGMissingGlyphElement

Yes

SVGNumber

Yes

SVGNumberList

Yes

SVGPaint
实现了 SVGPaint 接口
但不支持 CSS 中的 GetCSSText() 和 SetCSSText()
Yes

SVGPath

Yes

SVGPathElement

Yes

SVGPathSeg

Yes

SVGPathSegArcAbs

Yes

SVGPathSegArcRel

Yes

SVGPathSegClosePath

Yes

SVGPathSegCurvetoCubicAbs

Yes

SVGPathSegCurvetoCubicRel

Yes

SVGPathSegCurvetoCubicSmoothAbs

Yes

SVGPathSegCurvetoCubicSmoothRel

Yes

SVGPathSegCurvetoQuadraticAbs

Yes

SVGPathSegCurvetoQuadraticRel

Yes

SVGPathSegCurvetoQuadraticSmoothAbs

Yes

SVGPathSegCurvetoQuadraticSmoothRel

Yes

SVGPathSegLinetoAbs

Yes

SVGPathSegLinetoHorizontalAbs

Yes

SVGPathSegLinetoHorizontalRel

Yes

SVGPathSegLinetoRel

Yes

SVGPathSegLinetoVerticalAbs

Yes

SVGPathSegLinetoVerticalRel

Yes

SVGPathSegList

Yes

SVGPathSegMovetoAbs

Yes

SVGPathSegMovetoRel

Yes

SVGPatternElement

Yes

SVGPoint

Yes

SVGPointList

Yes

SVGPolygonElement

Yes

SVGPolylineElement

Yes

SVGPreserveAspectRatio

Yes

SVGRGBColor

Yes

SVGRadialGradientElement

Yes

SVGRect

Yes

SVGRectElement

Yes

SVGRenderingIntent

No

SVGSVGElement
当前的 SVG 视图

getIntersectionList()
getEnclosureList() 方法返回一个 StaticNdeList

ScreenPixelToMillimeterX
ScreenPixelToMillimeterY
PixelUnitToMillimeterX
PixelUnitToMillimeterY
使用硬编码值
Yes

SVGScriptElement

Yes

SVGSetElement

Yes

SVGStopElement

Yes

SVGStringList
每个 DOMString 在 NT 中只会显示一次
因为使用过了它就会被移除
Yes

SVGStylable
style 属性跟 HTML 中的 style 属性一样
Yes

SVGStyleElement
不支持 media, title 属性
Yes

SVGSwitchElement

Yes

SVGSymbolElement

Yes

SVGTRefElement

Yes

SVGTSpanElement

Yes

SVGTests

Yes

SVGTextContentElement

Yes

SVGTextElement

Yes

SVGTextPathElement

Yes

SVGTextPositioningElement

Yes

SVGTitleElement

Yes

SVGTransform

Yes

SVGTransformList

Yes

SVGTransformable

Yes

SVGURIReference

Yes

SVGUnitTypes

Yes

SVGUseElement

Yes

SVGVKernElement

Yes

SVGViewElement

Yes

SVGViewSpec

No

SVGZoomAndPan

Yes

SVGZoomEvent

No

TraitAccess

Yes

events::EventTarget
所有的 SVGElement 只类都有这个接口
Yes

smil::ElementTimeControl

Yes
