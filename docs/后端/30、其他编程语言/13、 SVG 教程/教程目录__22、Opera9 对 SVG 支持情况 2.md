# 22、Opera9 对 SVG 支持情况 2
- 来源：https://ddkk.com/zhuanlan/other/svg/22.html
- 分类：SVG 教程
- 分组：教程目录
长久以来 ,Opera 对 SVG 总是提不起兴趣，不过从 Opera9 开始陆陆续续的支持了好多

> 不用详细的看，Opera 在中国的市场份额基本快可以忽略不计，所以你做的 SVG 大可放心在中国运行

## SVG 属性支持情况

属性名
支持的元素
说明
SVG 版本
是否支持

accent-height
font-face
会被解析，但渲染时会忽略
1.1
No

accumulate
feImage
svg
g
defs
symbol
use
switch
marker
pattern
mask
filter
a
font
glyph
missing-glyph
foreignObject
text
tspan
tref
textPath
altGlyph
clipPath

1.1
Yes

alphabetic
font-face
会被解析，但渲染时会忽略
1.1
No

amplitude
feFuncR
feFuncG
feFuncB
feFuncA

1.1
Yes

arabic-form
glyph

1.1
Yes

ascent
font-face

1.1
Yes

attributeType
animate
set
animateColor
animateTransform

1.1
Yes

azimuth
feDistantLight

1.1
Yes

baseFrequency
feTurbulence

1.1
Yes

baseProfile
svg
渲染时会忽略
1.1
No

bbox
font-face
会被解析，但渲染时会忽略
1.1
No

bias
feConvolveMatrix

1.1
Yes

by
animate
animateColor
animateTransform
animateMotion

1.1
Yes

calcMode
animateMotion

1.1
Yes

cap-height
font-face
会被解析，但渲染时会忽略
1.1
No

class
all elements

1.1
Yes

clipPathUnits
clipPath

1.1
Yes

contentScriptType
svg

1.1
Yes

contentStyleType
svg

1.1
Yes

cx
circle
ellipse
radialGradient

1.1
Yes

cy
circle
ellipse
radialGradient

1.1
Yes

d
glyph
missing-glyph
path

1.1
Yes

descent
font-face

1.1
Yes

diffuseConstant
feDiffuseLightning

1.1
Yes

direction
feImage
svg
g
defs
symbol
use
switch
marker
pattern
mask
filter
a
font
glyph
missing-glyph
foreignObject
text
tspan
tref
textPath
altGlyph
clipPath

1.1
Yes

divisor
feConvolveMatrix

1.1
Yes

dur
animate
set
animateMotion
animateColor
animateTransform

1.1
Yes

dx
text
tspan
tref
altGlyph
glyphRef
feOffset

1.1
Yes

dy
text
tspan
tref
altGlyph
glyphRef
feOffset

1.1
Yes

edgeMode
feConvolveMatrix

1.1
Yes

editable
text
textArea

1.2
Yes

elevation
feDistantLight

1.1
Yes

end
animate
set
animateMotion
animateColor
animateTransform

1.1
Yes

exponent
feFuncR
feFuncG
feFuncB
feFuncA

1.1
Yes

externalResourcesRequired
g
defs
symbol
use
image
switch
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
marker
linearGradient
radialGradient
pattern
clipPath
mask
filter
feImage
cursor
a
view
script
animate
set
animateMotion
animateColor
animateTransform
font
foreignObject
svg
mpath

1.1
Yes

fill
animate
set
animateMotion
animateColor
animateTransform

1.1
Yes

filterRes
filter

1.1
Yes

filterUnits
filter

1.1
Yes

focusHighlight
a
animation
circle
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
svg
switch
text
textArea
tspan
use
video

1.2
Yes

focusable
a
animation
circle
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
svg
switch
text
textArea
tspan
use
video

1.2
Yes

font-family
font-face

1.1
Yes

font-size
font-face

1.1
Yes

font-stretch
font-face

1.1
No

font-style
font-face

1.1
Yes

font-variant
font-face

1.1
Yes

font-weight
font-face

1.1
Yes

format
altGlyph
glyphRef
The altGlyph and glyphRef elements are not supported
1.1
No

from
animate
animateColor
animateTransform
animateMotion

1.1
Yes

fx
radialGradient

1.1
Yes

fy
radialGradient

1.1
Yes

g1
hkern
vkern

1.1
Yes

g2
hkern
vkern

1.1
Yes

glyph-name
glyph

1.1
Yes

glyphRef
altGlyph
glyphRef
The altGlyph and glyphRef elements are not supported
1.1
No

gradientTransform
radialGradient
linearGradient

1.1
Yes

gradientUnits
radialGradient
linearGradient

1.1
Yes

hanging
font-face
Not used in rendering but checked during parsing.
1.1
No

height
svg
filter
feMerge
feTurbulence
use
pattern
mask
rect
foreignObject
image

1.1
Yes

horiz-adv-x
glyph
missing-glyph
font

1.1
Yes

horiz-origin-x
glyph
missing-glyph
font
Origin is always at (0,0)
1.1
No

horiz-origin-y
glyph
missing-glyph
font
Origin is always at (0,0)
1.1
No

ideographic
font-face
Not used in rendering but checked during parsing.
1.1
No

in
feComponentTransfer
feFlood
feTile
feBlend
feColorMatrix
feComposite
feConvolveMatrix
feDiffuseLighting
feDisplacementMap
feGaussianBlur
feMorphology
feOffset
feSpecularLighting
feMergeNode

1.1
Yes

in2
feBlend
feComposite
feDisplacementMap

1.1
Yes

initialVisibility
video
animation
Not used in rendering but checked during parsing.
1.2
No

intercept
feFuncR
feFuncG
feFuncB
feFuncA

1.1
Yes

k
hkern
vkern

1.1
Yes

k1
feComposite

1.1
Yes

k2
feComposite

1.1
Yes

k3
feComposite

1.1
Yes

k4
feComposite

1.1
Yes

kernelMatrix
feConvolveMatrix

1.1
Yes

kernelUnitLength
feConvolveMatrix
feDiffuseLighting
feSpecularLighting

1.1
Yes

keyPoints
animateMotion

1.1
Yes

keySplines
animate
animateColor
animateTransform
animateMotion

1.1
Yes

keyTimes
animate
animateColor
animateTransform
animateMotion

1.1
Yes

lang
glyph
Language information not used when selecting glyphs.
1.1
No

lengthAdjust
textPath
text
tspan
tref

1.1
Yes

limitingConeAngle
feSpotLight

1.1
Yes

local
color-profile

1.1
No

markerHeight
marker

1.1
Yes

markerUnits
marker

1.1
Yes

markerWidth
marker

1.1
Yes

maskContentUnits
mask

1.1
Yes

maskUnits
mask

1.1
Yes

mathematical
font-face
Not used in rendering but checked during parsing.
1.1
No

max
animate
set
animateMotion
animateColor
animateTransform

1.1
Yes

media
style

1.1
No

method
textPath

1.1
Yes

min
animate
set
animateMotion
animateColor
animateTransform

1.1
Yes

mode
feBlend

1.1
Yes

name
color-profile

1.1
No

nav-down
a
animation
circle
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
svg
switch
text
textArea
tspan
use
video

1.2
Yes

nav-down-left
a
animation
circle
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
svg
switch
text
textArea
tspan
use
video

1.2
Yes

nav-down-right
a
animation
circle
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
svg
switch
text
textArea
tspan
use
video

1.2
Yes

nav-left
a
animation
circle
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
svg
switch
text
textArea
tspan
use
video

1.2
Yes

nav-next
a
animation
circle
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
svg
switch
text
textArea
tspan
use
video

1.2
Yes

nav-prev
a
animation
circle
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
svg
switch
text
textArea
tspan
use
video

1.2
Yes

nav-right
a
animation
circle
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
svg
switch
text
textArea
tspan
use
video

1.2
Yes

nav-up
a
animation
circle
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
svg
switch
text
textArea
tspan
use
video

1.2
Yes

nav-up-left
a
animation
circle
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
svg
switch
text
textArea
tspan
use
video

1.2
Yes

nav-up-right
a
animation
circle
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
svg
switch
text
textArea
tspan
use
video

1.2
Yes

numOctaves
feTurbulence

1.1
Yes

offset
stop
feFuncR
feFuncG
feFuncB
feFuncA

1.1
Yes

onabort
svg

1.1
Yes

onactivate
g
defs
symbol
switch
svg
use
image
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
a
foreignObject
The event listener is registered
but currently the event itself is never dispatched in Opera.
1.1
Yes

onbegin
animate
set
animateMotion
animateColor
animateTransform

1.1
Yes

onclick
g
defs
symbol
switch
svg
use
image
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
a
foreignObject

1.1
Yes

onend
animate
set
animateMotion
animateColor
animateTransform

1.1
Yes

onerror
animate
set
animateMotion
animateColor
animateTransform

1.1
Yes

onfocusin
g
defs
symbol
switch
svg
use
image
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
a
foreignObject

1.1
Yes

onfocusout
g
defs
symbol
switch
svg
use
image
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
a
foreignObject

1.1
Yes

onload
g
defs
symbol
switch
svg
use
image
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
a
foreignObject

1.1
Yes

onmousedown
g
defs
symbol
switch
svg
use
image
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
a
foreignObject

1.1
Yes

onmousemove
g
defs
symbol
switch
svg
use
image
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
a
foreignObject

1.1
Yes

onmouseout
g
defs
symbol
switch
svg
use
image
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
a
foreignObject

1.1
Yes

onmouseover
g
defs
symbol
switch
svg
use
image
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
a
foreignObject

1.1
Yes

onmouseup
g
defs
symbol
switch
svg
use
image
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
a
foreignObject

1.1
Yes

onrepeat
animate
set
animateMotion
animateColor
animateTransform
Some events may be dropped if there's not enough time to handle them
for example when the duration of an animation is shorter than the time it takes to render the svg.
1.1
Yes

onresize
svg

1.1
Yes

onscroll
svg

1.1
Yes

onunload
svg
The event listener is registered
but currently the event itself is never dispatched in Opera.
1.1
Yes

onzoom
svg

1.1
Yes

operator
feMorphology
feComposite

1.1
Yes

order
feConvolveMatrix

1.1
Yes

orient
marker

1.1
Yes

orientation
glyph

1.1
No

overline-position
font-face

1.1
Yes

overline-thickness
font-face

1.1
Yes

panose-1
font-face
Not used in rendering but checked during parsing.
1.1
No

path
animateMotion

1.1
Yes

pathLength
path

1.1
Yes

patternContentUnits
pattern

1.1
Yes

patternTransform
pattern

1.1
Yes

patternUnits
pattern

1.1
Yes

points
polyline
polygon

1.1
Yes

pointsAtX
feSpotLight

1.1
Yes

pointsAtY
feSpotLight

1.1
Yes

pointsAtZ
feSpotLight

1.1
Yes

preserveAlpha
feConvolveMatrix

1.1
Yes

preserveAspectRatio
svg
symbol
image
marker
pattern
view

1.1
Yes

primitiveUnits
filter

1.1
Yes

r
radialGradient
circle

1.1
Yes

radius
feMorphology

1.1
Yes

refX
marker

1.1
Yes

refY
marker

1.1
Yes

rendering-intent
color-profile

1.1
No

repeatCount
animate
set
animateMotion
animateColor
animateTransform

1.1
Yes

repeatDur
animate
set
animateMotion
animateColor
animateTransform

1.1
Yes

requiredExtensions
svg
g
defs
use
image
switch
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
pattern
clipPath
mask
cursor
a
animate
set
animateMotion
animateColor
animateTransform
foreignObject

1.1
Yes

requiredFeatures
svg
g
defs
use
image
switch
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
pattern
clipPath
mask
cursor
a
animate
set
animateMotion
animateColor
animateTransform
foreignObject

1.1
Yes

requiredFonts
a
animate
animateColor
animateMotion
animateTransform
animation
audio
circle
discard
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
set
switch
text
textArea
tspan
use
video

1.2
Yes

requiredFormats
a
animate
animateColor
animateMotion
animateTransform
animation
audio
circle
discard
ellipse
foreignObject
g
image
line
path
polygon
polyline
rect
set
switch
text
textArea
tspan
use
video

1.2
Yes

restart
animate
set
animateMotion
animateColor
animateTransform

1.1
Yes

result
feMerge
feTurbulence

1.1
Yes

rotate
animateMotion
text
tspan
tref
altGlyph

1.1
Yes

rx
rect
ellipse

1.1
Yes

ry
rect
ellipse

1.1
Yes

scale
feDisplacementMap

1.1
Yes

seed
feTurbulence

1.1
Yes

slope
feFuncR
feFuncG
feFuncB
feFuncA

1.1
Yes

slope
font-face
Not used in rendering but checked during parsing.
1.1
No

snapshotTime
svg
Not used in rendering but checked during parsing.
1.2
No

spacing
textPath

1.1
No

specularConstant
feSpecularLighting

1.1
Yes

specularConstant
feSpecularLighting

1.1
Yes

specularExponent
feSpecularLighting
feSpotLight

1.1
Yes

spreadMethod
linearGradient
radialGradient

1.1
Yes

startOffset
textPath

1.1
Yes

stdDeviation
feGaussianBlur

1.1
Yes

stemh
font-face
Not used in rendering but checked during parsing.
1.1
No

stemv
font-face
Not used in rendering but checked during parsing.
1.1
No

stitchTiles
feTurbulence

1.1
Yes

strikethrough-position
font-face

1.1
Yes

strikethrough-thickness
font-face

1.1
Yes

style
svg
g
defs
desc
title
symbol
use
image
switch
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
glyphRef
marker
linearGradient
radialGradient
stop
pattern
clipPath
mask
filter
feImage
a
font
glyph
missing-glyph
foreignObject

1.1
Yes

surfaceScale
feDiffuseLighting
feSpecularLighting

1.1
Yes

syncBehavior
audio
video
animation
Parsing only.
1.2
No

syncBehaviorDefault
audio
video
animation
Parsing only.
1.2
No

syncMaster
audio
video
animation

1.2
No

syncTolerance
audio
video
animation

1.2
No

syncToleranceDefault
audio
video
animation

1.2
No

systemLanguage
svg
g
defs
use
image
switch
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
pattern
clipPath
mask
cursor
a
animate
set
animateMotion
animateColor
animateTransform
foreignObject

1.1
Yes

tableValues
feFuncR
feFuncG
feFuncB
feFuncA

1.1
Yes

target
a

1.1
Yes

targetX
feConvolveMatrix

1.1
Yes

targetY
feConvolveMatrix

1.1
Yes

textLength
text
tspan
tref
textPath

1.1
Yes

title
style

1.1
No

to
animate
animateColor
animateTransform
animateMotion
set

1.1
Yes

transform
g
defs
use
image
switch
path
rect
circle
ellipse
line
polyline
polygon
text
clipPath
a
foreignObject

1.1
Yes

type
feTurbulence
feColorMatrix
feFuncR
feFuncG
feFuncB
feFuncA
animateTransform
script
style
handler

1.1
Yes

u1
hkern
vkern

1.1
No

u2
hkern
vkern

1.1
No

underline-position
font-face

1.1
Yes

underline-thickness
font-face

1.1
Yes

unicode
glyph

1.1
Yes

unicode-range
font-face
Font selection based on presence of glyphs in unicode blocks.
1.1
No

units-per-em
font-face

1.1
Yes

v-alphabetic
font-face
Not used in rendering but checked during parsing.
1.1
No

v-hanging
font-face
Not used in rendering but checked during parsing.
1.1
No

v-ideographic
font-face
Not used in rendering but checked during parsing.
1.1
No

v-mathematical
font-face
Not used in rendering but checked during parsing.
1.1
No

values
animate
animateColor
animateTransform
animateMotion
feColorMatrix

1.1
Yes

version
svg
Always uses the same interpretation of the SVG.
1.1
No

vert-adv-y
font
glyph
missing-glyph

1.1
Yes

vert-origin-x
font
glyph
missing-glyph
Origin is always (0,0).
1.1
No

vert-origin-y
font
glyph
missing-glyph
Origin is always (0,0).
1.1
No

viewBox
svg
symbol
marker
pattern
view

1.1
Yes

viewTarget
view

1.1
No

width
svg
use
pattern
mask
filter
feMerge
feTurbulence

1.1
Yes

widths
font-face
Not used in rendering but checked during parsing.
1.1
No

x
glyphRef
fePointLight
feSpotLight
text
tspan
tref
altGlyph
svg
use
image
rect
pattern
mask
filter
feMerge
feTurbulence
cursor
foreignObject

1.1
Yes

x-height
font-face
Not used in rendering but checked during parsing.
1.1
No

x1
line
linearGradient

1.1
Yes

x2
line
linearGradient

1.1
Yes

xChannelSelector
feDisplacementMap

1.1
Yes

xlink:actuate
tref
textPath
altGlyph
glyphRef
color-profile
linearGradient
radialGradient
pattern
filter
cursor
script
mpath
font-face-uri
definition-src
use
image
feImage
a

1.1
No

xlink:arcrole
tref
textPath
altGlyph
glyphRef
color-profile
linearGradient
radialGradient
pattern
filter
cursor
script
mpath
font-face-uri
definition-src
use
image
feImage
a

1.1
No

xlink:href
glyphRef
color-profile
linearGradient
radialGradient
pattern
filter
script
animElementAttrs
altGlyph
use
image
tref
textPath
feImage
cursor
a
mpath
font-face-uri
definition-src

1.1
Yes

xlink:role
tref
textPath
altGlyph
glyphRef
color-profile
linearGradient
radialGradient
pattern
filter
cursor
script
mpath
font-face-uri
definition-src
use
image
feImage
a

1.1
No

xlink:show
tref
textPath
altGlyph
glyphRef
color-profile
linearGradient
radialGradient
pattern
filter
cursor
script
mpath
font-face-uri
definition-src
use
image
feImage
a

1.1
Yes

xlink:title
tref
textPath
altGlyph
glyphRef
color-profile
linearGradient
radialGradient
pattern
filter
cursor
script
mpath
font-face-uri
definition-src
use
image
feImage
a

1.1
Yes

xlink:type
tref
textPath
altGlyph
glyphRef
color-profile
linearGradient
radialGradient
pattern
filter
cursor
script
mpath
font-face-uri
definition-src
use
image
feImage
a

1.1
No

xml:base
altGlyphDef
altGlyphItem
font-face-src
metadata
svg
g
defs
desc
title
symbol
use
image
switch
style
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
glyphRef
marker
color-profile
linearGradient
radialGradient
stop
pattern
clipPath
mask
filter
feDistantLight
fePointLight
feSpotLight
feBlend
feColorMatrix
feComponentTransfer
feFuncR
feFuncG
feFuncB
feFuncA
feComposite
feConvolveMatrix
feDiffuseLighting
feDisplacementMap
feFlood
feGaussianBlur
feImage
feMerge
feMergeNode
feMorphology
feOffset
feSpecularLighting
feTile
feTurbulence
cursor
a
view
script
animate
set
animateMotion
mpath
animateColor
animateTransform
font
glyph
missing-glyph
hkern
vkern
font-face
font-face-uri
font-face-format
font-face-name
definition-src
foreignObject

1.1
Yes

xml:space
svg
g
defs
desc
title
symbol
use
image
switch
path
rect
circle
ellipse
line
polyline
polygon
text
tspan
tref
textPath
altGlyph
marker
pattern
clipPath
mask
filter
feImage
a
foreignObject
style

1.1
Yes

xmlns
svg

1.1
Yes

xmlns:xlink
a

1.1
Yes

y
svg
use
image
rect
pattern
mask
filter
feMerge
feTurbulence
foreignObject
cursor
text
tspan
tref
altGlyph
glyphRef
fePointLight
feSpotLight

1.1
Yes

y1
line
linearGradient

1.1
Yes

y2
line
linearGradient

1.1
Yes

yChannelSelector
feDisplacementMap

1.1
Yes

z
feSpotLight
fePointLight

1.1
Yes

zoomAndPan
svg
view

1.1
Yes
