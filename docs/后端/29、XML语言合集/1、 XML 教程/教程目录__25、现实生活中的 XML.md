# 25、现实生活中的 XML
- 来源：https://ddkk.com/zhuanlan/xml/xml/25.html
- 分类：其他语言
- 分组：教程目录
接下来我们使用一些范例来演示如何使用 XML 交换信息

### 范例：XML 新闻

**XML News 是用于交换新闻和其他信息的规范**

对新闻的供求双方来说，通过使用 XML 这种标准，可以使各种类型的新闻信息通过不同软硬件以及编程语言进行的制作、接收和存档更加容易

```xml
<?xml version="1.0" encoding="UTF-8"?>
<nitf>
    <head>
        <title>Colombia Earthquake</title>
    </head>
    <body>
        <headline>
            <hl1>143 Dead in Colombia Earthquake</hl1>
        </headline>
        <byline>
            <bytag>By Jared Kotler, Associated Press Writer</bytag>
        </byline>
        <dateline>
            <location>Bogota, Colombia</location>
            <date>Monday January 25 1999 7:28 ET</date>
        </dateline>
    </body>
</nitf>
```

## 范例：XML 气象服务

XML国家气象服务案例，来自 NOAA ( National Oceanic and Atmospheric Administration )

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<current_observation>
    <credit>NOAA's National Weather Service</credit>
    <credit_URL>http://weather.gov/</credit_URL>
    <image>
        <url>http://weather.gov/images/xml_logo.gif</url>
        <title>NOAA's National Weather Service</title>
        <link>http://weather.gov</link>
    </image>
    <location>New York/John F. Kennedy Intl Airport, NY</location>
    <station_id>KJFK</station_id>
    <latitude>40.66</latitude>
    <longitude>-73.78</longitude>
    <observation_time_rfc822>Mon, 11 Feb 2008 06:51:00 -0500 EST</observation_time_rfc822>
    <weather>A Few Clouds</weather>
    <temp_f>11</temp_f>
    <temp_c>-12</temp_c>
    <relative_humidity>36</relative_humidity>
    <wind_dir>West</wind_dir>
    <wind_degrees>280</wind_degrees>
    <wind_mph>18.4</wind_mph>
    <wind_gust_mph>29</wind_gust_mph>
    <pressure_mb>1023.6</pressure_mb>
    <pressure_in>30.23</pressure_in>
    <dewpoint_f>-11</dewpoint_f>
    <dewpoint_c>-24</dewpoint_c>
    <windchill_f>-7</windchill_f>
    <windchill_c>-22</windchill_c>
    <visibility_mi>10.00</visibility_mi>
    <icon_url_base>http://weather.gov/weather/images/fcicons/</icon_url_base>
    <icon_url_name>nfew.jpg</icon_url_name>
    <disclaimer_url>http://weather.gov/disclaimer.html</disclaimer_url>
    <copyright_url>http://weather.gov/disclaimer.html</copyright_url>
</current_observation>
```
