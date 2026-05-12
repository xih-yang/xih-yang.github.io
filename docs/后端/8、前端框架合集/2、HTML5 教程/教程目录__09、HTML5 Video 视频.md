# 09、HTML5 Video 视频
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/9.html
- 分类：前端框架
- 分组：教程目录
HTML5 提供了 `` 元素用于在网页中展示视频

### 检测浏览器支持

我们可以使用下面的 JavaScript 脚本来检测浏览器是否支持 HTML5 视频和支持视频的格式

```html
function checkVideo()
{
if(!!document.createElement('video').canPlayType)
  {
  var vidTest=document.createElement("video");
  oggTest=vidTest.canPlayType('video/ogg; codecs="theora, vorbis"');
  if (!oggTest)
    {
    h264Test=vidTest.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
    if (!h264Test)
      {
      document.getElementById("checkVideoResult").innerHTML="抱歉你的浏览器不支持HTML5 video标签！"
      }
    else
      {
      if (h264Test=="probably")
        {
        document.getElementById("checkVideoResult").innerHTML="非常棒！你的浏览器支持HTML5 video标签";
        }
      else
        {
        document.getElementById("checkVideoResult").innerHTML="Meh. Some support.";
        }
      }
    }
  else
    {
    if (oggTest=="probably")
      {
      document.getElementById("checkVideoResult").innerHTML="非常棒！你的浏览器支持HTML5 video标签！";
      }
    else
      {
      document.getElementById("checkVideoResult").innerHTML="Meh. Some support.";
      }
    }
  }
else
  {
  document.getElementById("checkVideoResult").innerHTML="Sorry. No video support."
  }
}
```

你可以点击按钮查看一下当前的浏览器是否支持 HTML5 视频

检测

## 浏览器支持

Internet Explorer 9+, Firefox, Opera, Chrome, 和 Safari 支持 `` 元素

> 注意: Internet Explorer 8 或者更早的 IE 版本不支持  元素

## HTML5  如何工作 ?

如果想要在 HTML5 中显示视频，我们如下使用 `` 元素

```html
<video width="320" height="240" controls>
  <source src="/static/i/html/html_video_1.mp4" type="video/mp4">
  <source src="/static/i/html/html_video_1.ogg" type="video/ogg">
您的浏览器不支持 <video> 标签
</video>
```

在这个范例中

**1、**``元素提供了播放、暂停和音量控件来控制视频；

**2、**``元素的属性width和height用于控制视频的尺寸；

如果设置的高度和宽度，所需的视频空间会在页面加载时保留

如果没有设置这些属性，浏览器不知道大小的视频

浏览器就不能再加载时保留特定的空间，页面就会根据原始视频的大小而改变
**3、**``与``标签之间插入的内容是提供给不支持video元素的浏览器显示的；

**4、**``元素支持多个``元素；

`` 元素可以链接不同的视频文件，浏览器将使用第一个可识别的格式

## 视频格式与浏览器的支持

`` 元素支持三种视频格式： MP4, WebM, 和 Ogg

浏览器
MP4
WebM
Ogg

Internet Explorer
YES
NO
NO

Chrome
YES
YES
YES

Firefox
YES
YES
YES

Safari
YES
NO
NO

Opera
YES (从 Opera 25 起)
YES
YES

**1、** MP4=带有H.264视频编码和AAC音频编码的MPEG4文件；

**2、** WebM=带有VP8视频编码和Vorbis音频编码的WebM文件；

**3、** Ogg=带有Theora视频编码和Vorbis音频编码的Ogg文件；

## 视频格式

格式
MIME-type

MP4
video/mp4

WebM
video/webm

Ogg
video/ogg

## HTML5  - 使用 DOM 进行控制

HTML5 `` 和 `` 元素同样拥有方法、属性和事件

`` 和 `` 元素的方法、属性和事件可以使用 JavaScript 进行控制

**1、** 其中的方法有用于播放、暂停以及加载等；

**2、** 其中的属性（比如时长、音量等）可以被读取或设置；

**3、** 其中的DOM事件能够通知您，比方说``元素开始播放、已暂停，已停止，等等；

### 范例

下面的范例演示了如何使用 `` 元素，读取并设置属性，以及如何调用方法

我们为视频创建简单的播放/暂停以及调整尺寸控件

播放/暂停 放大 缩小 普通

你的浏览器不支持 HTML5 video

这个范例调用了两个方法：play() 和 pause()

它同时使用了两个属性：paused 和 width

如果想了解更多关于 `` 元素的内容，可以访问我们的 HTML5 Audio/Video DOM 参考手册

## HTML5 Video 标签

标签
描述

定义一个视频

定义多种媒体资源,比如  和

定义在媒体播放器文本轨迹
