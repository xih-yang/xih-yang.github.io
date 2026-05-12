# 10、HTML5 Audio 音频
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/10.html
- 分类：前端框架
- 分组：教程目录
HTML5 提供了 `` 元素用于播放音频文件的标准

## 浏览器支持

Internet Explorer 9+, Firefox, Opera, Chrome, 和 Safari 都支持 `` 元素

> 注意: Internet Explorer 8 及更早 IE 版本不支持 元素

## HTML5 Audio - 如何工作

如果想要在 HTML5 中播放音频，可以如下方式使用 `` 元素

```html
<audio controls>
  <source src="/static/i/html/horse.ogg" type="audio/ogg">
  <source src="/static/i/html/horse.mp3" type="audio/mpeg">
您的浏览器不支持 audio 元素
</audio>
```

**1、** 属性``供添加播放、暂停和音量控件；

**2、** 在``与``之间需要插入浏览器不支持的``元素的提示文本；

**3、**``元素允许使用多个``元素；

`` 元素可以链接不同的音频文件，浏览器将使用第一个支持的音频文件

## 音频格式及浏览器支持

`` 元素支持三种音频格式文件: MP3, Wav, 和 Ogg

浏览器
MP3
Wav
Ogg

Internet Explorer 9+
YES
NO
NO

Chrome 6+
YES
YES
YES

Firefox 3.6+
YES
YES
YES

Safari 5+
YES
YES
NO

Opera 10+
YES
YES
YES

## 音频格式的 MIME 类型

格式
MIME-type

MP3
audio/mpeg

Ogg
audio/ogg

Wav
audio/wav

## HTML5 Audio 标签

标签
描述

定义了声音内容

设置多媒体资源, 可以是多个，在  与  标签中使用
