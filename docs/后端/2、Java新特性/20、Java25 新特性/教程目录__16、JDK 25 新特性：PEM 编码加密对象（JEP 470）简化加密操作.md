# 16、JDK 25 新特性：PEM 编码加密对象（JEP 470）简化加密操作
- 来源：https://ddkk.com/zhuanlan/java/java25/16.html
- 分类：JDK 25 新特性
- 分组：教程目录
- 日期：2025-11-27
搞加密开发的时候，最烦的就是处理各种格式的密钥和证书了。你从 OpenSSL 导出一个私钥，是 PEM 格式的，Java 里想用就得先转成 DER，再转成 KeySpec，最后才能用。反过来也一样，Java 里生成的密钥想给其他系统用，也得转来转去，麻烦死了。以前没标准 API，只能自己写工具类，或者用第三方库，代码写起来又臭又长。

PEM（Privacy-Enhanced Mail）格式是加密领域最常用的文本格式之一，它用 Base64 编码把二进制数据转成可读的文本，前后加上 `-----BEGIN XXX-----` 和 `-----END XXX-----` 这样的标记。这格式在 Linux、OpenSSL、各种安全工具里到处都是，但 Java 以前没有标准 API 来处理它。

JDK 25 里的 JEP 470 终于把这个缺口补上了，提供了 PEM 编码和解码的预览 API。现在你可以直接用 `PEMEncoder` 把密钥、证书、CRL 这些加密对象编码成 PEM 格式，用 `PEMDecoder` 把 PEM 格式的数据解码回 Java 对象，不用再手动 Base64 编码解码，也不用自己解析那些标记了。

这个 API 还支持加密的私钥，可以设置密码来加密或解密。对需要和其他系统、工具、设备交互的 Java 应用来说，这功能太实用了，能省不少事。

## PEM 格式是啥

先说说 PEM 格式是咋回事吧。PEM 是 Privacy-Enhanced Mail 的缩写，虽然名字里有 Mail，但现在主要用来编码加密对象，比如密钥、证书、证书撤销列表（CRL）等。

PEM 格式的结构很简单：开头是 `-----BEGIN XXX-----`，中间是 Base64 编码的数据（每行 64 个字符），结尾是 `-----END XXX-----`。XXX 表示对象类型，比如 `PRIVATE KEY`、`PUBLIC KEY`、`CERTIFICATE`、`CERTIFICATE REQUEST` 等。

为啥用 Base64 呢？因为加密对象都是二进制数据，直接存文本文件里会有问题，比如换行符、特殊字符啥的。Base64 把二进制转成 ASCII 字符，只包含字母、数字、加号、斜杠这些安全字符，可以安全地存文本文件、发邮件、贴到配置文件里。

PEM 格式的优势有几个：第一个是可读性好，是文本格式，可以直接看、编辑、复制粘贴。第二个是兼容性强，Linux、OpenSSL、各种安全工具都支持，是事实上的标准。第三个是传输方便，可以发邮件、存配置文件、贴到文档里，不会因为二进制数据出问题。第四个是调试方便，出问题了可以直接看文件内容，不用拿十六进制工具瞅。

## DER 编码是啥

PEM 格式的底层是 DER（Distinguished Encoding Rules）编码。DER 是 ASN.1（Abstract Syntax Notation One）的一种编码规则，用来把数据结构编码成二进制格式。

加密对象，比如 X.509 证书、PKCS#8 私钥、PKCS#10 证书请求等，都是用 ASN.1 定义的，编码成 DER 格式。PEM 就是把 DER 编码的二进制数据用 Base64 编码，再加上头尾标记。

Java 里很多加密对象都实现了 `DEREncodable` 接口，表示可以编码成 DER 格式。JEP 470 的 PEM API 就是基于这个接口的，所有实现了 `DEREncodable` 的对象都可以用 PEM API 编码解码。

## 基本用法

PEM API 的使用很简单，先创建编码器或解码器，然后调用编码或解码方法就行了。

```java
import java.security.PEMEncoder;
import java.security.PEMDecoder;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
public class PEMBasicExample {
    public static void main(String[] args) throws Exception {
        // 生成一个密钥对
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");  // 创建 RSA 密钥对生成器
        keyGen.initialize(2048);  // 初始化，密钥长度 2048 位
        KeyPair keyPair = keyGen.generateKeyPair();  // 生成密钥对，包含公钥和私钥
        // 编码密钥对为 PEM 格式
        PEMEncoder encoder = PEMEncoder.of();  // 创建 PEM 编码器实例
        String pemKeyPair = encoder.encodeToString(keyPair);  // 把密钥对编码成 PEM 格式的字符串
        System.out.println("编码后的密钥对：");
        System.out.println(pemKeyPair);  // 打印 PEM 格式的密钥对，会看到 -----BEGIN PRIVATE KEY----- 和 -----END PRIVATE KEY----- 这样的标记
        // 解码 PEM 格式的密钥对
        PEMDecoder decoder = PEMDecoder.of();  // 创建 PEM 解码器实例
        KeyPair decodedKeyPair = decoder.decode(pemKeyPair, KeyPair.class);  // 把 PEM 字符串解码回 KeyPair 对象
        System.out.println("解码成功，公钥算法: " + decodedKeyPair.getPublic().getAlgorithm());  // 打印公钥算法，应该是 "RSA"
        System.out.println("解码成功，私钥算法: " + decodedKeyPair.getPrivate().getAlgorithm());  // 打印私钥算法，应该是 "RSA"
    }
}
```

这个例子展示了怎么用 PEM API 编码和解码密钥对。`PEMEncoder.of()` 创建编码器，`encodeToString()` 把对象编码成 PEM 字符串。`PEMDecoder.of()` 创建解码器，`decode()` 把 PEM 字符串解码回对象。

## 编码私钥

私钥是最常用的加密对象之一，PEM API 支持编码各种格式的私钥。

```java
import java.security.PEMEncoder;
import java.security.PEMDecoder;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.KeyPair;
public class PEMPrivateKeyExample {
    public static void main(String[] args) throws Exception {
        // 生成 RSA 密钥对
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");  // 创建 RSA 密钥对生成器
        keyGen.initialize(2048);  // 初始化，密钥长度 2048 位
        KeyPair keyPair = keyGen.generateKeyPair();  // 生成密钥对
        PrivateKey privateKey = keyPair.getPrivate();  // 获取私钥
        // 编码私钥为 PEM 格式
        PEMEncoder encoder = PEMEncoder.of();  // 创建编码器，这方法返回一个不可变的编码器实例
        String pemPrivateKey = encoder.encodeToString(privateKey);  // 编码私钥，会生成 -----BEGIN PRIVATE KEY----- 格式，返回的是完整的 PEM 字符串
        System.out.println("私钥 PEM 格式：");
        System.out.println(pemPrivateKey);  // 打印 PEM 格式的私钥，可以看到头尾标记和中间的 Base64 数据
        // 解码 PEM 格式的私钥
        PEMDecoder decoder = PEMDecoder.of();  // 创建解码器
        PrivateKey decodedPrivateKey = decoder.decode(pemPrivateKey, PrivateKey.class);  // 解码回 PrivateKey 对象
        System.out.println("解码成功，私钥算法: " + decodedPrivateKey.getAlgorithm());  // 打印私钥算法
        System.out.println("私钥格式: " + decodedPrivateKey.getFormat());  // 打印私钥格式，应该是 "PKCS#8"
    }
}
```

这个例子展示了怎么编码和解码私钥。私钥会被编码成 `-----BEGIN PRIVATE KEY-----` 格式，这是 PKCS#8 格式的私钥。

## 编码公钥

公钥也可以编码成 PEM 格式，通常有两种格式：`PUBLIC KEY`（SubjectPublicKeyInfo）和 `RSA PUBLIC KEY`（PKCS#1）。

```java
import java.security.PEMEncoder;
import java.security.PEMDecoder;
import java.security.KeyPairGenerator;
import java.security.PublicKey;
import java.security.KeyPair;
public class PEMPublicKeyExample {
    public static void main(String[] args) throws Exception {
        // 生成 RSA 密钥对
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");  // 创建 RSA 密钥对生成器
        keyGen.initialize(2048);  // 初始化，密钥长度 2048 位
        KeyPair keyPair = keyGen.generateKeyPair();  // 生成密钥对
        PublicKey publicKey = keyPair.getPublic();  // 获取公钥
        // 编码公钥为 PEM 格式
        PEMEncoder encoder = PEMEncoder.of();  // 创建编码器
        String pemPublicKey = encoder.encodeToString(publicKey);  // 编码公钥，会生成 -----BEGIN PUBLIC KEY----- 格式
        System.out.println("公钥 PEM 格式：");
        System.out.println(pemPublicKey);  // 打印 PEM 格式的公钥
        // 解码 PEM 格式的公钥
        PEMDecoder decoder = PEMDecoder.of();  // 创建解码器
        PublicKey decodedPublicKey = decoder.decode(pemPublicKey, PublicKey.class);  // 解码回 PublicKey 对象
        System.out.println("解码成功，公钥算法: " + decodedPublicKey.getAlgorithm());  // 打印公钥算法
        System.out.println("公钥格式: " + decodedPublicKey.getFormat());  // 打印公钥格式，应该是 "X.509"
    }
}
```

这个例子展示了怎么编码和解码公钥。公钥会被编码成 `-----BEGIN PUBLIC KEY-----` 格式，这是 SubjectPublicKeyInfo 格式的公钥。

## 编码证书

X.509 证书也可以编码成 PEM 格式，这是最常见的证书格式。

```java
import java.security.PEMEncoder;
import java.security.PEMDecoder;
import java.security.KeyPairGenerator;
import java.security.KeyPair;
import java.security.cert.X509Certificate;
import java.security.cert.CertificateFactory;
import java.io.ByteArrayInputStream;
import java.math.BigInteger;
import java.util.Date;
import javax.security.auth.x500.X500Principal;
import java.security.cert.X509Certificate;
import sun.security.x509.X509CertImpl;
import sun.security.x509.X509CertInfo;
import sun.security.x509.CertificateValidity;
import sun.security.x509.CertificateSerialNumber;
import sun.security.x509.CertificateSubjectName;
import sun.security.x509.CertificateIssuerName;
import sun.security.x509.CertificateX509Key;
import sun.security.x509.AlgorithmId;
import sun.security.x509.X500Name;
import java.security.cert.CertificateEncodingException;
public class PEMCertificateExample {
    public static void main(String[] args) throws Exception {
        // 生成密钥对（实际使用中，证书应该从 CA 获取或自己签名）
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");  // 创建 RSA 密钥对生成器
        keyGen.initialize(2048);  // 初始化
        KeyPair keyPair = keyGen.generateKeyPair();  // 生成密钥对
        // 这里简化处理，实际应该创建完整的证书
        // 假设我们有一个证书对象（实际使用中应该从文件或证书库加载）
        // 为了演示，我们创建一个简单的示例
        // 编码证书为 PEM 格式（假设 certificate 是一个 X509Certificate 对象）
        PEMEncoder encoder = PEMEncoder.of();  // 创建编码器
        // 注意：实际使用中，你需要有一个真实的 X509Certificate 对象
        // 这里只是演示编码过程，实际证书应该从 KeyStore、文件或其他来源获取
        System.out.println("证书编码示例（需要真实的证书对象）");
        // 如果你有一个证书对象，可以这样编码：
        // String pemCertificate = encoder.encodeToString(certificate);  // 编码证书，会生成 -----BEGIN CERTIFICATE----- 格式
        // System.out.println("证书 PEM 格式：");
        // System.out.println(pemCertificate);
        // 解码 PEM 格式的证书
        // 假设 pemCert 是 PEM 格式的证书字符串
        // PEMDecoder decoder = PEMDecoder.of();  // 创建解码器
        // X509Certificate decodedCert = decoder.decode(pemCert, X509Certificate.class);  // 解码回 X509Certificate 对象
        // System.out.println("解码成功，证书主题: " + decodedCert.getSubjectDN());  // 打印证书主题
    }
}
```

这个例子展示了怎么编码和解码证书。证书会被编码成 `-----BEGIN CERTIFICATE-----` 格式。注意实际使用中需要真实的证书对象，这里只是演示结构。

## 编码加密的私钥

私钥可以用密码加密，这样更安全。PEM API 支持编码和解码加密的私钥。

```java
import java.security.PEMEncoder;
import java.security.PEMDecoder;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.KeyPair;
public class PEMEncryptedPrivateKeyExample {
    public static void main(String[] args) throws Exception {
        // 生成 RSA 密钥对
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");  // 创建 RSA 密钥对生成器
        keyGen.initialize(2048);  // 初始化
        KeyPair keyPair = keyGen.generateKeyPair();  // 生成密钥对
        PrivateKey privateKey = keyPair.getPrivate();  // 获取私钥
        // 编码私钥为加密的 PEM 格式
        char[] password = "mySecretPassword".toCharArray();  // 设置加密密码，用字符数组而不是字符串，用完可以清零更安全
        PEMEncoder encoder = PEMEncoder.of()  // 创建编码器，返回一个构建器
            .withEncryption(password);  // 设置加密密码，这样编码出来的私钥会被加密，用的是 PKCS#8 加密格式
        String pemEncryptedPrivateKey = encoder.encodeToString(privateKey);  // 编码私钥，会生成加密的 PEM 格式，格式是 -----BEGIN ENCRYPTED PRIVATE KEY-----
        System.out.println("加密的私钥 PEM 格式：");
        System.out.println(pemEncryptedPrivateKey);  // 打印加密的 PEM 格式私钥，会看到 -----BEGIN ENCRYPTED PRIVATE KEY----- 格式，和普通私钥不一样
        // 解码加密的 PEM 格式私钥
        PEMDecoder decoder = PEMDecoder.of()  // 创建解码器
            .withDecryption(password);  // 设置解密密码，必须和编码时用的密码一样
        PrivateKey decodedPrivateKey = decoder.decode(pemEncryptedPrivateKey, PrivateKey.class);  // 解码回 PrivateKey 对象
        System.out.println("解码成功，私钥算法: " + decodedPrivateKey.getAlgorithm());  // 打印私钥算法
        // 如果密码不对，解码会失败
        try {
            PEMDecoder wrongDecoder = PEMDecoder.of()
                .withDecryption("wrongPassword".toCharArray());  // 用错误的密码
            decoder.decode(pemEncryptedPrivateKey, PrivateKey.class);  // 这会抛出异常
        } catch (Exception e) {
            System.out.println("密码错误，解码失败: " + e.getMessage());  // 打印错误信息
        }
    }
}
```

这个例子展示了怎么编码和解码加密的私钥。`withEncryption()` 设置加密密码，编码出来的私钥会被加密。`withDecryption()` 设置解密密码，解码时需要提供正确的密码。

## 从文件读取 PEM 数据

实际使用中，PEM 数据通常存在文件里。PEM API 支持从字符串或输入流读取。

```java
import java.security.PEMDecoder;
import java.security.PrivateKey;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.io.InputStream;
public class PEMFileExample {
    public static void main(String[] args) throws Exception {
        // 从文件读取 PEM 格式的私钥
        String pemFilePath = "private_key.pem";  // PEM 文件路径
        String pemContent = new String(Files.readAllBytes(Paths.get(pemFilePath)));  // 读取文件内容为字符串
        // 解码 PEM 格式的私钥
        PEMDecoder decoder = PEMDecoder.of();  // 创建解码器
        PrivateKey privateKey = decoder.decode(pemContent, PrivateKey.class);  // 从字符串解码
        System.out.println("从文件读取私钥成功，算法: " + privateKey.getAlgorithm());  // 打印私钥算法
        // 或者直接从输入流读取
        try (InputStream is = Files.newInputStream(Paths.get(pemFilePath))) {  // 打开文件输入流
            PEMDecoder streamDecoder = PEMDecoder.of();  // 创建解码器
            PrivateKey keyFromStream = streamDecoder.decode(is, PrivateKey.class);  // 从输入流解码
            System.out.println("从输入流读取私钥成功，算法: " + keyFromStream.getAlgorithm());  // 打印私钥算法
        }
    }
}
```

这个例子展示了怎么从文件读取 PEM 数据。可以读取文件内容为字符串，然后解码；也可以直接从输入流解码，更省内存。

## 编码证书撤销列表

证书撤销列表（CRL，Certificate Revocation List）也可以编码成 PEM 格式。

```java
import java.security.PEMEncoder;
import java.security.PEMDecoder;
import java.security.cert.X509CRL;
import java.io.ByteArrayInputStream;
public class PEMCRLExample {
    public static void main(String[] args) throws Exception {
        // 注意：实际使用中，CRL 应该从 CA 或证书库获取
        // 这里只是演示编码解码过程
        PEMEncoder encoder = PEMEncoder.of();  // 创建编码器
        // 如果你有一个 X509CRL 对象，可以这样编码：
        // String pemCRL = encoder.encodeToString(crl);  // 编码 CRL，会生成 -----BEGIN X509 CRL----- 格式
        // System.out.println("CRL PEM 格式：");
        // System.out.println(pemCRL);
        // 解码 PEM 格式的 CRL
        // 假设 pemCrl 是 PEM 格式的 CRL 字符串
        // PEMDecoder decoder = PEMDecoder.of();  // 创建解码器
        // X509CRL decodedCRL = decoder.decode(pemCrl, X509CRL.class);  // 解码回 X509CRL 对象
        // System.out.println("解码成功，CRL 颁发者: " + decodedCRL.getIssuerDN());  // 打印 CRL 颁发者
        System.out.println("CRL 编码解码示例（需要真实的 CRL 对象）");
    }
}
```

这个例子展示了怎么编码和解码 CRL。CRL 会被编码成 `-----BEGIN X509 CRL-----` 格式。注意实际使用中需要真实的 CRL 对象。

## 处理多种 PEM 类型

PEM 格式支持多种类型，比如私钥、公钥、证书、证书请求等。PEMDecoder 可以自动识别类型。

```java
import java.security.PEMDecoder;
import java.security.DEREncodable;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.cert.X509Certificate;
public class PEMMultipleTypesExample {
    public static void main(String[] args) throws Exception {
        PEMDecoder decoder = PEMDecoder.of();  // 创建解码器
        // 假设我们有几个不同格式的 PEM 字符串
        String pemPrivateKey = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----";  // 私钥 PEM
        String pemPublicKey = "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----";  // 公钥 PEM
        String pemCertificate = "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----";  // 证书 PEM
        // 解码时指定类型
        PrivateKey privateKey = decoder.decode(pemPrivateKey, PrivateKey.class);  // 解码为私钥
        PublicKey publicKey = decoder.decode(pemPublicKey, PublicKey.class);  // 解码为公钥
        X509Certificate certificate = decoder.decode(pemCertificate, X509Certificate.class);  // 解码为证书
        // 或者不指定类型，解码为 DEREncodable，然后根据实际类型处理
        DEREncodable obj1 = decoder.decode(pemPrivateKey);  // 解码为 DEREncodable
        if (obj1 instanceof PrivateKey) {  // 判断是否是私钥
            PrivateKey key = (PrivateKey) obj1;  // 强制转换为私钥
            System.out.println("解码为私钥，算法: " + key.getAlgorithm());  // 打印算法
        }
    }
}
```

这个例子展示了怎么处理多种 PEM 类型。可以指定类型解码，也可以解码为 `DEREncodable`，然后根据实际类型处理。

## 与 OpenSSL 互操作

PEM 格式最大的优势就是和其他工具互操作方便，特别是 OpenSSL。

```java
import java.security.PEMEncoder;
import java.security.PEMDecoder;
import java.security.KeyPairGenerator;
import java.security.KeyPair;
import java.nio.file.Files;
import java.nio.file.Paths;
public class PEMOpenSSLExample {
    public static void main(String[] args) throws Exception {
        // 生成密钥对
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");  // 创建 RSA 密钥对生成器
        keyGen.initialize(2048);  // 初始化
        KeyPair keyPair = keyGen.generateKeyPair();  // 生成密钥对
        // 编码为 PEM 格式
        PEMEncoder encoder = PEMEncoder.of();  // 创建编码器
        String pemPrivateKey = encoder.encodeToString(keyPair.getPrivate());  // 编码私钥
        String pemPublicKey = encoder.encodeToString(keyPair.getPublic());  // 编码公钥
        // 保存到文件，OpenSSL 可以直接使用
        Files.write(Paths.get("java_private_key.pem"), pemPrivateKey.getBytes());  // 保存私钥到文件
        Files.write(Paths.get("java_public_key.pem"), pemPublicKey.getBytes());  // 保存公钥到文件
        System.out.println("密钥已保存为 PEM 格式，OpenSSL 可以直接使用");
        System.out.println("可以用以下命令验证：");
        System.out.println("openssl rsa -in java_private_key.pem -text -noout");  // OpenSSL 查看私钥命令
        System.out.println("openssl rsa -in java_public_key.pem -pubin -text -noout");  // OpenSSL 查看公钥命令
        // 从 OpenSSL 生成的文件读取
        // 假设 openssl_private_key.pem 是 OpenSSL 生成的文件
        // String opensslPem = new String(Files.readAllBytes(Paths.get("openssl_private_key.pem")));  // 读取文件
        // PEMDecoder decoder = PEMDecoder.of();  // 创建解码器
        // PrivateKey opensslKey = decoder.decode(opensslPem, PrivateKey.class);  // 解码为 Java 私钥
        // System.out.println("从 OpenSSL 文件读取成功，算法: " + opensslKey.getAlgorithm());  // 打印算法
    }
}
```

这个例子展示了怎么和 OpenSSL 互操作。Java 生成的 PEM 格式密钥可以直接给 OpenSSL 用，OpenSSL 生成的文件也可以直接读进 Java，非常方便。

## 错误处理

使用 PEM API 时，可能会遇到各种错误，比如格式不对、密码错误、类型不匹配等。

```java
import java.security.PEMDecoder;
import java.security.PrivateKey;
public class PEMErrorHandlingExample {
    public static void main(String[] args) {
        PEMDecoder decoder = PEMDecoder.of();  // 创建解码器
        // 格式错误的 PEM 数据
        try {
            String invalidPem = "这不是有效的 PEM 格式";  // 无效的 PEM 字符串
            decoder.decode(invalidPem, PrivateKey.class);  // 这会抛出异常
        } catch (Exception e) {
            System.out.println("格式错误: " + e.getMessage());  // 打印错误信息
        }
        // 类型不匹配
        try {
            String pemPublicKey = "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----";  // 公钥 PEM
            decoder.decode(pemPublicKey, PrivateKey.class);  // 尝试解码为私钥，会失败
        } catch (Exception e) {
            System.out.println("类型不匹配: " + e.getMessage());  // 打印错误信息
        }
        // 密码错误（加密的私钥）
        try {
            String encryptedPem = "-----BEGIN ENCRYPTED PRIVATE KEY-----\n...\n-----END ENCRYPTED PRIVATE KEY-----";  // 加密的私钥
            PEMDecoder wrongDecoder = PEMDecoder.of()
                .withDecryption("wrongPassword".toCharArray());  // 错误的密码
            wrongDecoder.decode(encryptedPem, PrivateKey.class);  // 解码会失败
        } catch (Exception e) {
            System.out.println("密码错误: " + e.getMessage());  // 打印错误信息
        }
    }
}
```

这个例子展示了怎么处理各种错误情况。格式错误、类型不匹配、密码错误等都会抛出异常，需要适当处理。

## 性能考虑

PEM API 的性能是啥样的呢？编码和解码操作主要是 Base64 编码解码，性能通常很好。

对于大多数应用来说，PEM API 的性能开销是可以接受的。如果性能是瓶颈，可以考虑缓存编码结果，或者使用二进制格式（DER）而不是文本格式（PEM）。

但大多数情况下，PEM 格式的便利性比性能更重要，特别是需要和其他系统互操作的时候。

## 启用预览特性

JEP 470 的 PEM API 是预览特性，默认是关闭的，需要启用才能用。

编译时启用预览特性：

```bash
javac --release 25 --enable-preview PEMExample.java
```

运行时启用预览特性：

```bash
java --enable-preview PEMExample
```

或者在 JShell 里启用：

```bash
jshell --enable-preview
```

注意预览特性可能在后续版本中修改或移除，生产环境使用要谨慎。

## 最佳实践

用 PEM API 的时候，有几个最佳实践。第一个是验证数据来源。从外部读取 PEM 数据时，要验证来源是否可信，防止恶意数据。特别是从网络、用户输入、配置文件读取的时候，更要小心。

第二个是安全存储密码。加密私钥的密码要安全存储，不要硬编码在代码里，可以用环境变量、配置文件、密钥管理服务等。密码用完了记得清零，特别是字符数组，防止内存泄露。

第三个是错误处理要完善。PEM 格式可能不规范，解码可能失败，要做好错误处理，给用户友好的错误信息。

第四个是类型检查。解码时尽量指定具体类型，而不是用 `DEREncodable`，这样类型更安全，也更容易发现错误。

第五个是文件权限。保存 PEM 文件时，特别是私钥文件，要设置合适的文件权限，防止未授权访问。

## 总结

JEP 470 的 PEM API 给 Java 提供了标准的 PEM 编码解码功能，这是个重要的增强。通过使用标准的 PEM API，开发者可以更方便地处理 PEM 格式的加密对象，不用再手动 Base64 编码解码，也不用自己解析标记了。

PEM API 支持密钥、证书、CRL 等多种对象，支持加密的私钥，可以从字符串或输入流读取，可以和其他工具（如 OpenSSL）互操作。API 设计简单，使用方便，对需要 PEM 格式支持的应用来说，这是个重要的功能。

如果你需要处理 PEM 格式的加密对象，建议使用 JEP 470 的 PEM API，它既方便又标准，是处理 PEM 格式的最佳选择。记住要启用预览特性，遵循最佳实践，确保安全性和可靠性。虽然现在是预览特性，但 API 设计得不错，用起来挺顺手的，等正式版出来应该变化不大。
