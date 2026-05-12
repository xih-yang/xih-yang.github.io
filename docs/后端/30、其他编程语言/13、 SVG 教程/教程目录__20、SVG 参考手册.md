# 20、SVG 参考手册
- 来源：https://ddkk.com/zhuanlan/other/svg/20.html
- 分类：SVG 教程
- 分组：教程目录
下表列出了 **SVG** 所有可用的元素和属性，以及说明

元素
说明
属性

创建一个SVG元素周围链接
xlink:show
xlink:actuate
xlink:href
target

允许对象性文字进行控制，来呈现特殊的字符数据
x
y
dx
dy
rotate
glyphRef
format
xlink:href

定义一系列象性符号的替换
id

定义一系列候选的象性符号的替换
id

随时间动态改变属性
attributeName
from
to
dur
repeatCount

定义随着时间的推移颜色转换
by
from
to

使元素沿着动作路径移动
calcMode
path
keyPoints
rotate
xlink:href

动画上一个目标元素变换属性，从而使动画控制平移，缩放，旋转或倾斜
by
from
to
type

显示一个圆
cx
cy
rrequired

+ 显现属性：color
FillStroke
Graphics

用于隐藏位于剪切路径以外的对象部分。定义绘制什么和什么不绘制的模具被称为剪切路径
clip-path
clipPathUnits

指定颜色配置文件的说明（使用CSS样式文件时）
local
name
rendering-intent
xlink:href

定义一个独立于平台的自定义光标
x
y
xlink:href

引用的元素容器

对 SVG 中的元素的纯文本描述 - 并不作为图形的一部分来显示。用户代理会将其显示为工具提示

定义一个椭圆
cx
cy
rxrequired
ryrequired

+ 显现属性：
color
FillStroke
Graphics

使用不同的混合模式把两个对象合成在一起
mode>
in
in2

feColorMatrix
SVG滤镜。适用矩阵转换

feComponentTransfer
SVG 滤镜，执行数据的 component-wise 重映射

feComposite
SVG 滤镜

feConvolveMatrix
SVG 滤镜

feDiffuseLighting
SVG 滤镜

feDisplacementMap
SVG 滤镜

feDistantLight
SVG滤镜。定义一个光源

feFlood
SVG滤镜

feFuncA
SVG 滤镜。feComponentTransfer 的子元素

feFuncB
SVG 滤镜。feComponentTransfer 的子元素

feFuncG
SVG 滤镜。feComponentTransfer 的子元素

feFuncR
SVG 滤镜。feComponentTransfer 的子元素

feGaussianBlur
SVG滤镜。执行高斯模糊图像

feImage
SVG滤镜

feMerge
SVG滤镜，建立在彼此顶部图像层

feMergeNode
SVG 滤镜，feMerge的子元素

feMorphology
SVG 滤镜，对源图形执行"fattening | thinning"

feOffset
SVG滤镜，相对其当前位置移动图像

fePointLight
SVG滤镜

feSpecularLighting
SVG滤镜

feSpotLight
SVG滤镜

feTile
SVG滤镜

feTurbulence
SVG滤镜

filter
滤镜效果的容器

font
定义字体

font-face
描述一种字体的特点

font-face-format

font-face-name

font-face-src

font-face-uri

foreignObject

用于把相关元素进行组合的容器元素
id
fill
opacity

+ 显现属性:All

glyph
为给定的象形符号定义图形

glyphRef
定义要使用的可能的象形符号

hkern

定义图像
x
y
widthrequired
heightrequired
xlink:hrefrequired

+ 显现属性:
Color
Graphics
Images
Viewports

定义一条线
x1
y1
x2
y2

+ 显现属性:
Color
 FillStroke
Graphics
Markers

定义线性渐变。通过使用矢量线性渐变填充对象，并可以定义为水平，垂直或角渐变。
id
gradientUnits
gradientTransform
x1
y1
x2
y2
spreadMethod
xlink:href

标记可以放在直线，折线，多边形和路径的顶点。这些元素可以使用maeker属性的"maeker-start"，"maeker-mid"和"maeker-end"，继承默认情况下或可设置为"none"或定义的标记的URI。您必须先定义标记，然后才可以通过其URI引用。任何一种形状，可以把标记放在里面。他们绘制元素时把它们附加到顶部
markerUnits
refx
refy
orient
markerWidth
markerHeight
viewBox

+ 显示属性:
All

度屏蔽是一种不透明度值的组合和裁剪。像裁剪，您可以使用图形，文字或路径定义掩码的部分。一个掩码的默认状态是完全透明的，也就是裁剪平面的对面的。在掩码的图形设置掩码的不透明部分
maskUnits
maskContentUnits
x
y
width
height

metadata
指定元数据

missing-glyph

mpath

定义一个路径
d
pathLength
transform

+ 显现属性:
Color
FillStroke
Graphics
Markers

定义坐标、想要显示的视图和视图的大小。然后添加到模式形状中
该模式命中时重复视图框的边缘（可视范围）
idrequired
patternUnits
patternContentUnits
patternTransform
xy
width
height
viewBox
xlink:href

定义一个包含至少三边图形
pointsrequired
fill-rule

+ 显现属性:
Color
FillStroke
Graphics
Markers

定义只有直线组成的任意形状
pointsrequired

显现属性:
Color
FillStroke
Graphics
Markers

定义放射性渐变。放射性渐变创建一个圆圈
gradientUnits
gradientTransform
cy
r
fx
fy
spreadMethod
xlink:href

显示一个矩形
x
y
rx
ry
widthrequired
heightrequired

+ 显现属性:
Color
FillStroke
Graphics

script
脚本容器（例如ECMAScript）

set
设置一个属性值指定时间

渐变停止
offset
stop-color
stop-opacity

style
可使样式表直接嵌入SVG内容内部

创建一个SVG文档片段
x
y
width
height
viewBox
preserveAspectRatio
zoomAndPan
xml
xmlns
xmlns:xlink
xml:space

显现属性:
All

switch

symbol

显示一个文本
x
y
dx
dy
rotate
textLength
lengthAdjust

 显现属性:
Color
FillStroke
Graphics
FontSpecification
TextContentElements

textPath

title
对 SVG 中的元素的纯文本描述
并不作为图形的一部分来显示
用户代理会将其显示为工具提示

引用任何SVG文档中的元素和重用
与元素相同

元素等同于，但可以在内部嵌套文本标记以及内部本身
与  元素相同

 附加:
xlink:href

使用URI引用一个,或其他具有一个唯一的ID属性和重复的图形元素。复制的是原始的元素，因此文件中的原始存在只是一个参考。原始影响到所有副本的任何改变。
x
y
width
height
xlink:href

+ 显示属性:
All

view

vkern
