# 15、JDK 25 新特性：密钥派生函数 API（JEP 510）安全增强
- 来源：https://ddkk.com/zhuanlan/java/java25/15.html
- 分类：JDK 25 新特性
- 分组：教程目录
- 日期：2025-11-27
你有没有想过，为啥一个密钥能派生出多个不同的密钥？比如 TLS 握手的时候，一个主密钥能派生出加密密钥、MAC 密钥、IV 等多个密钥，这是咋做到的？答案就是密钥派生函数（Key Derivation Function，KDF）。

密钥派生函数是个加密算法，能从主密钥和其他数据派生出额外的密钥。这在很多场景下都很有用，比如 TLS 密钥交换、密码加密、密钥封装等。以前 Java 里没有标准的 KDF API，开发者得自己实现或者用第三方库，容易出错，也不够安全。

JDK 25 里的 JEP 510 终于把 KDF API 从预览特性提升为正式特性了。这个 API 提供了标准的密钥派生功能，支持 HKDF（HMAC-based Extract-and-Expand Key Derivation Function）等算法，符合 RFC 5869 标准。你可以用它来派生密钥，不用自己实现了，既安全又方便。

这个 API 还支持在 KEM（Key Encapsulation Mechanism）实现中使用，比如 ML-KEM，以及在 TLS 1.3 的混合密钥交换和 HPKE（Hybrid Public Key Encryption）等协议中使用。对需要密钥派生的应用来说，这是个重要的安全增强。

## 密钥派生函数是啥

先说说密钥派生函数是咋回事吧。密钥派生函数是个加密算法，能从主密钥（Master Key）和其他数据（比如盐值、信息等）派生出额外的密钥。

为啥需要密钥派生呢？第一个原因是密钥重用不安全。如果你用一个密钥加密多个数据，或者用同一个密钥做多个操作，可能会泄露密钥信息，不安全。密钥派生能让你从主密钥派生出不同的密钥，每个密钥只用于一个目的，更安全。

第二个原因是密钥长度不匹配。不同的加密算法需要不同长度的密钥，比如 AES-128 需要 128 位密钥，AES-256 需要 256 位密钥。密钥派生能让你从任意长度的主密钥派生出指定长度的密钥，解决长度不匹配的问题。

第三个原因是密钥管理更简单。你只需要管理一个主密钥，其他密钥都可以从主密钥派生出来，不需要单独存储和管理，密钥管理更简单。

第四个原因是符合标准。很多加密协议和标准都要求使用密钥派生，比如 TLS、IPsec 等，使用标准的密钥派生函数能确保符合这些标准。

## HKDF 算法

JEP 510 主要支持 HKDF 算法，这是目前最常用的密钥派生函数之一。HKDF 是基于 HMAC 的密钥派生函数，符合 RFC 5869 标准。

HKDF 有两个阶段：提取（Extract）和扩展（Expand）。提取阶段从输入密钥材料（Input Key Material，IKM）和盐值（Salt）提取出伪随机密钥（Pseudo-Random Key，PRK）。扩展阶段从 PRK 和信息（Info）扩展出指定长度的密钥材料。

HKDF 的优势有几个：第一个是安全性好，基于 HMAC，安全性有保障。第二个是灵活性高，可以只做提取、只做扩展，或者先提取再扩展。第三个是标准化，符合 RFC 5869 标准，兼容性好。

## 基本用法

KDF API 的使用很简单，先获取 KDF 实例，然后设置参数，最后派生密钥。

```java
import javax.crypto.KDF;
import javax.crypto.spec.HKDFParameterSpec;
import javax.crypto.SecretKey;
import java.security.SecureRandom;
public class KDFBasicExample {
    public static void main(String[] args) throws Exception {
        // 获取 HKDF-SHA256 实例
        KDF hkdf = KDF.getInstance("HKDF-SHA256");  // 创建 HKDF 实例，使用 SHA-256 作为底层哈希算法
        // 生成输入密钥材料和盐值
        SecureRandom random = new SecureRandom();  // 创建安全随机数生成器，用来生成密钥和盐值
        byte[] ikm = new byte[32];  // 输入密钥材料，32 字节
        byte[] salt = new byte[16];  // 盐值，16 字节
        random.nextBytes(ikm);  // 生成随机输入密钥材料
        random.nextBytes(salt);  // 生成随机盐值
        // 创建参数：先提取，再扩展
        HKDFParameterSpec params = HKDFParameterSpec.ofExtract()  // 开始构建参数，使用提取然后扩展模式
            .addIKM(ikm)  // 添加输入密钥材料
            .addSalt(salt)  // 添加盐值
            .thenExpand("application context".getBytes(), 256);  // 然后扩展，信息是 "application context"，派生 256 位密钥
        // 派生 AES 密钥
        SecretKey key = hkdf.deriveKey("AES", params);  // 派生 AES 密钥，长度由扩展阶段指定（256 位）
        System.out.println("派生密钥算法: " + key.getAlgorithm());  // 打印密钥算法，应该是 "AES"
        System.out.println("派生密钥长度: " + key.getEncoded().length * 8 + " 位");  // 打印密钥长度，应该是 256 位
    }
}
```

这个例子展示了怎么用 KDF API 派生密钥。`KDF.getInstance("HKDF-SHA256")` 用来获取 HKDF 实例，`HKDFParameterSpec.ofExtract()` 用来构建参数，`deriveKey()` 用来派生密钥。

## 只提取模式

有时候你只需要提取阶段，不需要扩展阶段。比如你已经有了 PRK，只需要用它来派生密钥。

```java
import javax.crypto.KDF;
import javax.crypto.spec.HKDFParameterSpec;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
public class KDFExtractOnlyExample {
    public static void main(String[] args) throws Exception {
        // 获取 HKDF-SHA256 实例
        KDF hkdf = KDF.getInstance("HKDF-SHA256");  // 创建 HKDF 实例
        // 生成输入密钥材料和盐值
        SecureRandom random = new SecureRandom();  // 创建安全随机数生成器
        byte[] ikm = new byte[32];  // 输入密钥材料
        byte[] salt = new byte[16];  // 盐值
        random.nextBytes(ikm);  // 生成随机输入密钥材料
        random.nextBytes(salt);  // 生成随机盐值
        // 只做提取，得到 PRK
        HKDFParameterSpec extractParams = HKDFParameterSpec.ofExtract()  // 开始构建参数，只做提取
            .extractOnly()  // 设置为只提取模式
            .addIKM(ikm)  // 添加输入密钥材料
            .addSalt(salt);  // 添加盐值
        // 派生 PRK（伪随机密钥）
        byte[] prk = hkdf.deriveData(extractParams);  // 派生 PRK，返回字节数组
        System.out.println("PRK 长度: " + prk.length + " 字节");  // 打印 PRK 长度，应该是哈希算法输出长度（SHA-256 是 32 字节）
        // 后续可以用 PRK 来扩展密钥
        // 这里只是演示，实际使用中可能需要保存 PRK 供后续使用
    }
}
```

这个例子展示了怎么只用提取阶段。`extractOnly()` 用来设置为只提取模式，`deriveData()` 用来派生数据（PRK），而不是密钥对象。

## 只扩展模式

有时候你已经有了 PRK，只需要扩展阶段，不需要提取阶段。

```java
import javax.crypto.KDF;
import javax.crypto.spec.HKDFParameterSpec;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
public class KDFExpandOnlyExample {
    public static void main(String[] args) throws Exception {
        // 获取 HKDF-SHA256 实例
        KDF hkdf = KDF.getInstance("HKDF-SHA256");  // 创建 HKDF 实例
        // 假设你已经有了 PRK（伪随机密钥）
        SecureRandom random = new SecureRandom();  // 创建安全随机数生成器
        byte[] prk = new byte[32];  // PRK，32 字节（SHA-256 的输出长度）
        random.nextBytes(prk);  // 生成随机 PRK（实际使用中，PRK 应该从提取阶段得到）
        // 只做扩展，从 PRK 派生密钥
        HKDFParameterSpec expandParams = HKDFParameterSpec.expandOnly(  // 创建只扩展模式的参数
            new SecretKeySpec(prk, "RAW"),  // PRK 作为密钥，类型是 RAW（原始字节）
            "application context".getBytes(),  // 信息，用于区分不同的派生密钥
            256  // 派生密钥长度，256 位
        );
        // 派生 AES 密钥
        SecretKey key = hkdf.deriveKey("AES", expandParams);  // 派生 AES 密钥
        System.out.println("派生密钥算法: " + key.getAlgorithm());  // 打印密钥算法
        System.out.println("派生密钥长度: " + key.getEncoded().length * 8 + " 位");  // 打印密钥长度
    }
}
```

这个例子展示了怎么只用扩展阶段。`expandOnly()` 用来创建只扩展模式的参数，需要提供 PRK、信息和派生密钥长度。

## 在 TLS 中的应用

KDF API 在 TLS 中特别有用，可以用来派生会话密钥。TLS 1.3 使用 HKDF 来派生各种密钥，比如客户端写密钥、服务器写密钥、MAC 密钥等。

```java
import javax.crypto.KDF;
import javax.crypto.spec.HKDFParameterSpec;
import javax.crypto.SecretKey;
import java.security.SecureRandom;
public class TLSUsageExample {
    public static void main(String[] args) throws Exception {
        // 模拟 TLS 握手后的主密钥
        SecureRandom random = new SecureRandom();  // 创建安全随机数生成器
        byte[] masterSecret = new byte[48];  // TLS 主密钥，48 字节
        random.nextBytes(masterSecret);  // 生成随机主密钥（实际使用中，主密钥应该从密钥交换得到）
        // 获取 HKDF 实例
        KDF hkdf = KDF.getInstance("HKDF-SHA256");  // 创建 HKDF 实例，TLS 1.3 使用 SHA-256
        // 派生客户端写密钥
        byte[] clientWriteLabel = "client write key".getBytes();  // 客户端写密钥标签
        HKDFParameterSpec clientWriteParams = HKDFParameterSpec.ofExtract()  // 开始构建参数
            .addIKM(masterSecret)  // 添加主密钥作为输入密钥材料
            .addSalt(new byte[0])  // TLS 1.3 中，盐值可能是空的
            .thenExpand(clientWriteLabel, 128);  // 扩展出 128 位客户端写密钥
        SecretKey clientWriteKey = hkdf.deriveKey("AES", clientWriteParams);  // 派生客户端写密钥
        // 派生服务器写密钥
        byte[] serverWriteLabel = "server write key".getBytes();  // 服务器写密钥标签
        HKDFParameterSpec serverWriteParams = HKDFParameterSpec.ofExtract()  // 开始构建参数
            .addIKM(masterSecret)  // 添加主密钥
            .addSalt(new byte[0])  // 盐值
            .thenExpand(serverWriteLabel, 128);  // 扩展出 128 位服务器写密钥
        SecretKey serverWriteKey = hkdf.deriveKey("AES", serverWriteParams);  // 派生服务器写密钥
        System.out.println("客户端写密钥长度: " + clientWriteKey.getEncoded().length * 8 + " 位");  // 打印客户端写密钥长度
        System.out.println("服务器写密钥长度: " + serverWriteKey.getEncoded().length * 8 + " 位");  // 打印服务器写密钥长度
    }
}
```

这个例子展示了怎么在 TLS 中使用 KDF API 派生会话密钥。通过不同的标签（Label），可以从同一个主密钥派生出不同的密钥，用于不同的目的。

## 在密码加密中的应用

KDF API 也可以用在密码加密中，从用户密码派生加密密钥。

```java
import javax.crypto.KDF;
import javax.crypto.spec.HKDFParameterSpec;
import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
public class PasswordEncryptionExample {
    public static void main(String[] args) throws Exception {
        // 用户密码
        String password = "user_password_123";  // 用户密码（实际使用中应该从安全输入获取）
        byte[] passwordBytes = password.getBytes(StandardCharsets.UTF_8);  // 转换为字节数组
        // 生成盐值（实际使用中，盐值应该和加密数据一起存储）
        SecureRandom random = new SecureRandom();  // 创建安全随机数生成器
        byte[] salt = new byte[16];  // 盐值，16 字节
        random.nextBytes(salt);  // 生成随机盐值
        // 获取 HKDF 实例
        KDF hkdf = KDF.getInstance("HKDF-SHA256");  // 创建 HKDF 实例
        // 从密码派生加密密钥
        HKDFParameterSpec params = HKDFParameterSpec.ofExtract()  // 开始构建参数
            .addIKM(passwordBytes)  // 添加密码作为输入密钥材料
            .addSalt(salt)  // 添加盐值
            .thenExpand("encryption key".getBytes(), 256);  // 扩展出 256 位加密密钥
        SecretKey encryptionKey = hkdf.deriveKey("AES", params);  // 派生 AES 加密密钥
        System.out.println("加密密钥长度: " + encryptionKey.getEncoded().length * 8 + " 位");  // 打印加密密钥长度
        // 注意：实际使用中，盐值应该和加密数据一起存储，解密时需要相同的盐值
        // 这里只是演示密钥派生过程，实际的加密和解密需要额外的代码
    }
}
```

这个例子展示了怎么从用户密码派生加密密钥。通过使用盐值，即使相同的密码也能派生出不同的密钥，提高了安全性。

## 在 HPKE 中的应用

HPKE（Hybrid Public Key Encryption）是个新的加密标准，也使用 KDF 来派生密钥。

```java
import javax.crypto.KDF;
import javax.crypto.spec.HKDFParameterSpec;
import javax.crypto.SecretKey;
import java.security.SecureRandom;
public class HPKEUsageExample {
    public static void main(String[] args) throws Exception {
        // 模拟 HPKE 共享密钥（实际使用中，共享密钥应该从密钥交换得到）
        SecureRandom random = new SecureRandom();  // 创建安全随机数生成器
        byte[] sharedSecret = new byte[32];  // 共享密钥，32 字节
        random.nextBytes(sharedSecret);  // 生成随机共享密钥
        // 获取 HKDF 实例
        KDF hkdf = KDF.getInstance("HKDF-SHA256");  // 创建 HKDF 实例，HPKE 使用 SHA-256
        // HPKE 信息结构（实际使用中，信息应该包含协议版本、模式等）
        byte[] info = "HPKE-v1".getBytes();  // HPKE 信息（简化示例）
        // 派生密钥封装密钥（Key Encapsulation Key）
        HKDFParameterSpec kekParams = HKDFParameterSpec.ofExtract()  // 开始构建参数
            .addIKM(sharedSecret)  // 添加共享密钥
            .addSalt(new byte[0])  // HPKE 中，盐值可能是空的
            .thenExpand(info, 256);  // 扩展出 256 位密钥封装密钥
        SecretKey kek = hkdf.deriveKey("AES", kekParams);  // 派生密钥封装密钥
        System.out.println("密钥封装密钥长度: " + kek.getEncoded().length * 8 + " 位");  // 打印密钥长度
        // 注意：实际使用中，HPKE 的密钥派生过程更复杂，需要遵循 RFC 9180 标准
        // 这里只是演示基本的密钥派生过程
    }
}
```

这个例子展示了怎么在 HPKE 中使用 KDF API。HPKE 使用 KDF 来派生各种密钥，包括密钥封装密钥、导出密钥等。

## 安全提供者集成

KDF API 支持安全提供者（Security Provider）集成，安全提供者可以实现自己的 KDF 算法。

```java
import javax.crypto.KDF;
import java.security.Provider;
import java.security.Security;
public class ProviderExample {
    public static void main(String[] args) throws Exception {
        // 获取所有安全提供者
        Provider[] providers = Security.getProviders();  // 获取所有已注册的安全提供者
        System.out.println("可用的安全提供者：");  // 打印标题
        for (Provider provider : providers) {  // 遍历所有提供者
            System.out.println("- " + provider.getName() + " (版本 " + provider.getVersion() + ")");  // 打印提供者名称和版本
        }
        // 从特定提供者获取 KDF 实例
        try {
            KDF hkdf = KDF.getInstance("HKDF-SHA256", "SUN");  // 从 SUN 提供者获取 HKDF 实例
            System.out.println("\nKDF 提供者: " + hkdf.getProviderName());  // 打印 KDF 的提供者名称
        } catch (Exception e) {
            System.out.println("无法从指定提供者获取 KDF: " + e.getMessage());  // 打印错误信息
        }
    }
}
```

这个例子展示了怎么查看和使用安全提供者。KDF API 支持从特定提供者获取实例，也支持自动选择提供者。

## 最佳实践

用 KDF API 的时候，有几个最佳实践。第一个是使用强随机数生成器。输入密钥材料和盐值应该用 `SecureRandom` 生成，不要用普通的随机数生成器。

第二个是盐值要唯一。每个密钥派生操作应该使用不同的盐值，确保派生出的密钥不同。盐值可以是随机生成的，也可以是从上下文信息派生的。

第三个是信息要明确。信息（Info）应该包含足够的上下文信息，比如用途、协议版本等，确保不同用途的密钥不会冲突。

第四个是密钥长度要合适。派生密钥的长度应该符合加密算法的要求，比如 AES-128 需要 128 位，AES-256 需要 256 位。

第五个是不要重用输入密钥材料。同一个输入密钥材料不应该用于多个不同的目的，应该为每个目的派生不同的密钥。

## 性能考虑

KDF API 的性能是啥样的呢？HKDF 基于 HMAC，性能主要取决于底层哈希算法的性能。SHA-256 的性能通常很好，对大多数应用来说，KDF 的性能开销是可以接受的。

如果性能是瓶颈，可以考虑使用更快的哈希算法，比如 SHA-512（如果支持），或者使用硬件加速的哈希实现。但大多数情况下，KDF 的性能不是问题，安全性更重要。

## 总结

JEP 510 的 KDF API 给 Java 提供了标准的密钥派生功能，这是个重要的安全增强。通过使用标准的 KDF API，开发者可以更安全、更方便地派生密钥，不用自己实现或者用第三方库了。

KDF API 支持 HKDF 等算法，符合 RFC 5869 标准，可以在 TLS、HPKE 等协议中使用。API 设计灵活，支持只提取、只扩展、或者先提取再扩展等模式，能满足各种需求。

如果你需要密钥派生功能，建议使用 JEP 510 的 KDF API，它既安全又方便，是密钥派生的标准解决方案。记住要遵循最佳实践，使用强随机数、唯一盐值、明确信息等，确保密钥派生的安全性。
