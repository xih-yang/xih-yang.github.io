# 05、WSDL &lt;binding&gt; 元素
- 来源：https://ddkk.com/zhuanlan/other/wsdl/5.html
- 分类：其他语言
- 分组：教程目录
WSDL `` 元素为 web service 定义了消息格式和协议细节

## 绑定到 SOAP

看一个请求 - 响应 操作模型的范例

```xml
<message name="getTermRequest">
    <part name="term" type="xs:string"/>
</message>
<message name="getTermResponse">
    <part name="value" type="xs:string"/>
</message>
<portType name="glossaryTerms">
    <operation name="getTerm">
        <input message="getTermRequest"/>
        <output message="getTermResponse"/>
    </operation>
</portType>
<binding type="glossaryTerms" name="b1">
    <soap:binding 
      style="document" 
      transport="http://schemas.xmlsoap.org/soap/http" />
    <operation>
        <soap:operation soapAction="http://example.com/getTerm"/>
            <input>
                <soap:body use="literal"/>
            </input>
            <output>
                <soap:body use="literal"/>
            </output>
    </operation>
</binding>
```

`` 元素有两个属性 name 属性和 type 属性

- name 属性定义 binding 的名称
- type 属性指向用于 binding 的端口 `` 在这个范例中是 "glossaryTerms" 端口

`` 元素有两个属性 style 属性和 transport 属性:

- style 属性可取值 rpc 或 document 范例中我们使用 document
- transport 属性定义了要使用的 SOAP 协议 范例中中我们使用 HTTP

`` 元素定义了每个端口提供的操作符

对于每个操作，相应的 SOAP 行为都需要被定义。 同时我们必须定义如何对输入和输出进行编码，范例中中我们使用了 literal
