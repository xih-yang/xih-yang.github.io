# 7、JDK 24 新特性：密钥派生函数 API（JEP 478）预览版量子安全准备
- 来源：https://ddkk.com/zhuanlan/java/java24/7.html
- 分类：JDK 24 新特性
- 分组：教程目录
- 日期：2025-11-27
量子计算是加密领域最热门的话题之一。虽然现在量子计算机还没普及，但威胁已经来了。传统的加密算法，比如RSA、ECC，在量子计算机面前不堪一击，Shor算法能在多项式时间内破解这些算法，现有的加密体系可能都要重来。

鹏磊我之前就关注过这个问题，特别是做金融系统的时候，数据要加密存储，密钥管理是个大问题。以前用PBKDF2、scrypt这些密钥派生函数，虽然能用，但API不统一，用起来麻烦，而且这些算法在量子计算机面前可能也不够安全。现在量子计算机虽然还没普及，但数据要存几十年，现在加密的数据，等量子计算机普及了可能就被破解了，得提前准备。

现在好了，JDK 24的JEP 478（密钥派生函数API）虽然还是预览版，但确实能解决这个问题。这个特性提供了统一的密钥派生函数API，支持HKDF（HMAC-based Key Derivation Function）等算法，为量子安全做准备。虽然现在还是预览版，但已经能看到Java在朝着后量子密码学的方向发展了。兄弟们别磨叽，咱这就开始整活，把这个特性给整明白。

## 什么是密钥派生函数

先说说啥是密钥派生函数（Key Derivation Function，简称KDF）。密钥派生函数就是从一个主密钥（master key）或者密码（password）派生出一个或多个密钥的函数。为啥需要派生呢？因为不同的用途需要不同的密钥，比如加密用一把密钥，认证用另一把密钥，不能混用。

密钥派生函数有很多种，比如PBKDF2、scrypt、Argon2、HKDF这些。PBKDF2是老算法，虽然还能用，但安全性不如新算法。scrypt和Argon2是内存硬函数，抗暴力破解能力强，但计算成本高。HKDF是基于HMAC的密钥派生函数，RFC 5869标准，安全性好，性能也不错，适合很多场景。

以前Java里没有统一的密钥派生函数API，要用这些算法得自己实现或者用第三方库，麻烦不说，还容易出错。现在JEP 478提供了统一的API，用起来方便多了。

## JEP 478 的核心特性

JEP 478是JDK 24引入的一个预览特性，主要做了这么几件事：

1. **统一API**：提供了统一的密钥派生函数API，`javax.crypto.KDF`接口
2. **HKDF支持**：支持HKDF算法，包括extract-only、expand-only、extract-then-expand三种模式
3. **参数化设计**：通过`KDFParameters`和`HKDFParameterSpec`配置算法参数
4. **量子安全准备**：为后量子密码学做准备，支持量子安全的密钥派生算法
5. **预览特性**：目前还是预览版，需要启用预览特性才能用

这个特性是预览版，为啥呢？因为还在完善阶段，API可能还会调整，需要更多实际场景的验证。但已经能看到Java在朝着后量子密码学的方向发展了，未来可能会支持更多量子安全的算法。

## 密钥派生函数API使用

JEP 478提供了统一的密钥派生函数API，主要在`javax.crypto`包里。核心接口是`KDF`，参数类是`KDFParameters`和`HKDFParameterSpec`。咱一个个来看。

### KDF接口

`KDF`接口是密钥派生函数的核心接口，提供了获取算法信息、参数、派生密钥等方法。

```java
// 获取KDF实例
KDF kdf = KDF.getInstance("HKDF");
// 获取算法名称
String algorithm = kdf.getAlgorithm();  // 返回 "HKDF"
// 获取参数
KDFParameters params = kdf.getParameters();
// 派生密钥
SecretKey derivedKey = kdf.deriveKey("AES", paramSpec);
// 派生密钥材料
byte[] keyMaterial = kdf.deriveData(paramSpec);
```

### HKDFParameterSpec

`HKDFParameterSpec`是HKDF算法的参数规范，支持三种模式：extract-only、expand-only、extract-then-expand。

```java
// Extract-only模式：只执行extract操作
HKDFParameterSpec.Extract extractSpec = HKDFParameterSpec.ofExtract()
    .extractOnly()
    .salt(salt)  // 盐值
    .ikm(ikm);  // 输入密钥材料
// Expand-only模式：只执行expand操作
HKDFParameterSpec.Expand expandSpec = HKDFParameterSpec.expandOnly(
    prk,  // 伪随机密钥（PRK）
    info,  // 上下文和应用特定信息
    256  // 派生密钥长度（位）
);
// Extract-then-expand模式：先extract再expand
HKDFParameterSpec.ExtractThenExpand extractThenExpandSpec = 
    HKDFParameterSpec.ofExtract()
        .thenExpand(info, 256)  // 先extract，再expand
        .salt(salt)
        .ikm(ikm);
```

## 实际应用场景

密钥派生函数API适合哪些场景呢？鹏磊我觉得主要有这么几类：

### 1. 密钥管理

密钥管理是密钥派生函数最常见的应用场景。从一个主密钥派生出多个子密钥，用于不同的用途，比如加密、认证、签名等。

```java
// 密钥管理示例
public class KeyManager {
    private final SecretKey masterKey;
    public KeyManager(SecretKey masterKey) {
        this.masterKey = masterKey;
    }
    // 派生加密密钥
    public SecretKey deriveEncryptionKey(byte[] context) throws Exception {
        // 创建HKDF实例
        KDF kdf = KDF.getInstance("HKDF");
        // 配置参数：extract-then-expand模式
        HKDFParameterSpec.ExtractThenExpand spec = HKDFParameterSpec.ofExtract()
            .thenExpand(context, 256)  // 派生256位密钥
            .salt("encryption-salt".getBytes())  // 盐值
            .ikm(masterKey.getEncoded());  // 输入密钥材料
        // 派生密钥
        return kdf.deriveKey("AES", spec);
    }
    // 派生认证密钥
    public SecretKey deriveAuthenticationKey(byte[] context) throws Exception {
        KDF kdf = KDF.getInstance("HKDF");
        // 配置参数：extract-then-expand模式
        HKDFParameterSpec.ExtractThenExpand spec = HKDFParameterSpec.ofExtract()
            .thenExpand(context, 256)  // 派生256位密钥
            .salt("auth-salt".getBytes())  // 不同的盐值
            .ikm(masterKey.getEncoded());
        // 派生密钥
        return kdf.deriveKey("HmacSHA256", spec);
    }
    // 派生签名密钥
    public SecretKey deriveSigningKey(byte[] context) throws Exception {
        KDF kdf = KDF.getInstance("HKDF");
        // 配置参数：extract-then-expand模式
        HKDFParameterSpec.ExtractThenExpand spec = HKDFParameterSpec.ofExtract()
            .thenExpand(context, 256)  // 派生256位密钥
            .salt("signing-salt".getBytes())  // 不同的盐值
            .ikm(masterKey.getEncoded());
        // 派生密钥
        return kdf.deriveKey("HmacSHA256", spec);
    }
}
```

### 2. 密码加密

密码加密是密钥派生函数的另一个常见应用。从用户密码派生出加密密钥，用于加密用户数据。

```java
// 密码加密示例
public class PasswordEncryption {
    // 从密码派生加密密钥
    public SecretKey deriveKeyFromPassword(String password, byte[] salt) throws Exception {
        // 创建HKDF实例
        KDF kdf = KDF.getInstance("HKDF");
        // 配置参数：extract-then-expand模式
        HKDFParameterSpec.ExtractThenExpand spec = HKDFParameterSpec.ofExtract()
            .thenExpand("encryption-context".getBytes(), 256)  // 上下文信息
            .salt(salt)  // 盐值
            .ikm(password.getBytes(StandardCharsets.UTF_8));  // 密码作为输入密钥材料
        // 派生密钥
        return kdf.deriveKey("AES", spec);
    }
    // 加密数据
    public byte[] encrypt(String password, byte[] data) throws Exception {
        // 生成随机盐值
        byte[] salt = generateSalt();
        // 从密码派生密钥
        SecretKey key = deriveKeyFromPassword(password, salt);
        // 加密数据
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] encrypted = cipher.doFinal(data);
        // 返回盐值和加密数据（实际应用中可能需要更复杂的格式）
        return combineSaltAndData(salt, encrypted);
    }
    // 解密数据
    public byte[] decrypt(String password, byte[] encryptedData) throws Exception {
        // 提取盐值和加密数据
        byte[] salt = extractSalt(encryptedData);
        byte[] encrypted = extractEncryptedData(encryptedData);
        // 从密码派生密钥
        SecretKey key = deriveKeyFromPassword(password, salt);
        // 解密数据
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key);
        return cipher.doFinal(encrypted);
    }
    private byte[] generateSalt() {
        // 生成随机盐值
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[16];
        random.nextBytes(salt);
        return salt;
    }
    private byte[] combineSaltAndData(byte[] salt, byte[] data) {
        // 组合盐值和数据（简化示例）
        ByteBuffer buffer = ByteBuffer.allocate(salt.length + data.length);
        buffer.put(salt);
        buffer.put(data);
        return buffer.array();
    }
    private byte[] extractSalt(byte[] combined) {
        // 提取盐值（简化示例）
        byte[] salt = new byte[16];
        System.arraycopy(combined, 0, salt, 0, 16);
        return salt;
    }
    private byte[] extractEncryptedData(byte[] combined) {
        // 提取加密数据（简化示例）
        byte[] data = new byte[combined.length - 16];
        System.arraycopy(combined, 16, data, 0, data.length);
        return data;
    }
}
```

### 3. 安全通信

安全通信中，密钥派生函数用于从共享密钥派生出会话密钥，用于加密通信数据。

```java
// 安全通信示例
public class SecureCommunication {
    // 从共享密钥派生会话密钥
    public SecretKey deriveSessionKey(SecretKey sharedKey, byte[] sessionId) throws Exception {
        // 创建HKDF实例
        KDF kdf = KDF.getInstance("HKDF");
        // 配置参数：extract-then-expand模式
        HKDFParameterSpec.ExtractThenExpand spec = HKDFParameterSpec.ofExtract()
            .thenExpand(sessionId, 256)  // 会话ID作为上下文
            .salt("session-salt".getBytes())  // 盐值
            .ikm(sharedKey.getEncoded());  // 共享密钥作为输入密钥材料
        // 派生会话密钥
        return kdf.deriveKey("AES", spec);
    }
    // 建立安全连接
    public void establishSecureConnection(SecretKey sharedKey, byte[] sessionId) throws Exception {
        // 派生会话密钥
        SecretKey sessionKey = deriveSessionKey(sharedKey, sessionId);
        // 使用会话密钥加密通信
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, sessionKey);
        // 发送加密数据
        byte[] data = "Hello, World!".getBytes();
        byte[] encrypted = cipher.doFinal(data);
        System.out.println("加密数据: " + Base64.getEncoder().encodeToString(encrypted));
    }
}
```

## HKDF算法详解

HKDF（HMAC-based Key Derivation Function）是RFC 5869定义的密钥派生函数，基于HMAC实现，安全性好，性能也不错。HKDF分两个阶段：extract和expand。

### Extract阶段

Extract阶段从输入密钥材料（IKM）和盐值（salt）提取伪随机密钥（PRK）。如果salt为空，就用全零的salt。

```java
// Extract-only模式示例
public SecretKey extractPRK(byte[] ikm, byte[] salt) throws Exception {
    // 创建HKDF实例
    KDF kdf = KDF.getInstance("HKDF");
    // 配置参数：extract-only模式
    HKDFParameterSpec.Extract spec = HKDFParameterSpec.ofExtract()
        .extractOnly()
        .salt(salt)  // 盐值
        .ikm(ikm);  // 输入密钥材料
    // 派生伪随机密钥（PRK）
    byte[] prk = kdf.deriveData(spec);
    // 转换为SecretKey
    return new SecretKeySpec(prk, "AES");
}
```

### Expand阶段

Expand阶段从伪随机密钥（PRK）和上下文信息（info）扩展出指定长度的密钥材料。

```java
// Expand-only模式示例
public SecretKey expandKey(SecretKey prk, byte[] info, int length) throws Exception {
    // 创建HKDF实例
    KDF kdf = KDF.getInstance("HKDF");
    // 配置参数：expand-only模式
    HKDFParameterSpec.Expand spec = HKDFParameterSpec.expandOnly(
        prk,  // 伪随机密钥（PRK）
        info,  // 上下文信息
        length  // 派生密钥长度（位）
    );
    // 派生密钥
    return kdf.deriveKey("AES", spec);
}
```

### Extract-then-expand模式

Extract-then-expand模式先执行extract，再执行expand，是最常用的模式。

```java
// Extract-then-expand模式示例
public SecretKey deriveKey(byte[] ikm, byte[] salt, byte[] info, int length) throws Exception {
    // 创建HKDF实例
    KDF kdf = KDF.getInstance("HKDF");
    // 配置参数：extract-then-expand模式
    HKDFParameterSpec.ExtractThenExpand spec = HKDFParameterSpec.ofExtract()
        .thenExpand(info, length)  // 先extract，再expand
        .salt(salt)  // 盐值
        .ikm(ikm);  // 输入密钥材料
    // 派生密钥
    return kdf.deriveKey("AES", spec);
}
```

## 量子安全准备

JEP 478的一个重要目标是量子安全准备。虽然现在量子计算机还没普及，但威胁已经来了。传统的加密算法，比如RSA、ECC，在量子计算机面前不堪一击，现有的加密体系可能都要重来。

密钥派生函数API为后量子密码学做准备，未来可能会支持更多量子安全的算法。虽然现在只支持HKDF，但API设计是通用的，可以扩展支持其他算法。

### 后量子密码学

后量子密码学（Post-Quantum Cryptography）是研究在量子计算机威胁下仍然安全的密码算法。虽然现在量子计算机还没普及，但数据要存几十年，现在加密的数据，等量子计算机普及了可能就被破解了，得提前准备。

密钥派生函数API为后量子密码学做准备，未来可能会支持更多量子安全的算法，比如基于格的密钥派生函数、基于哈希的密钥派生函数等。

## 最佳实践

用密钥派生函数API的时候，鹏磊我建议注意这么几点：

### 1. 使用强盐值

盐值要随机生成，长度要足够，至少16字节。盐值可以公开，但要保证唯一性，不能重复使用。

```java
// 推荐：使用强盐值
public byte[] generateStrongSalt() {
    SecureRandom random = new SecureRandom();
    byte[] salt = new byte[32];  // 32字节盐值
    random.nextBytes(salt);
    return salt;
}
// 不推荐：使用弱盐值
public byte[] generateWeakSalt() {
    return "weak-salt".getBytes();  // 固定盐值，不安全
}
```

### 2. 使用合适的上下文信息

上下文信息（info）要包含应用特定的信息，比如用途、版本号等，确保不同用途派生出的密钥不同。

```java
// 推荐：使用合适的上下文信息
public byte[] createContext(String purpose, String version) {
    return (purpose + ":" + version).getBytes(StandardCharsets.UTF_8);
}
// 不推荐：使用空上下文
public byte[] createEmptyContext() {
    return new byte[0];  // 空上下文，不安全
}
```

### 3. 派生密钥长度要足够

派生密钥长度要足够，至少128位（16字节），推荐256位（32字节）。密钥长度不够，安全性就下来了。

```java
// 推荐：使用足够的密钥长度
public SecretKey deriveKey(byte[] ikm, byte[] salt, byte[] info) throws Exception {
    KDF kdf = KDF.getInstance("HKDF");
    HKDFParameterSpec.ExtractThenExpand spec = HKDFParameterSpec.ofExtract()
        .thenExpand(info, 256)  // 256位密钥
        .salt(salt)
        .ikm(ikm);
    return kdf.deriveKey("AES", spec);
}
// 不推荐：使用过短的密钥长度
public SecretKey deriveShortKey(byte[] ikm, byte[] salt, byte[] info) throws Exception {
    KDF kdf = KDF.getInstance("HKDF");
    HKDFParameterSpec.ExtractThenExpand spec = HKDFParameterSpec.ofExtract()
        .thenExpand(info, 64)  // 64位密钥，太短
        .salt(salt)
        .ikm(ikm);
    return kdf.deriveKey("AES", spec);
}
```

### 4. 启用预览特性

JEP 478是预览特性，需要在编译和运行时启用预览特性。

```bash
# 编译时启用预览特性
javac --enable-preview --release 24 MyClass.java
# 运行时启用预览特性
java --enable-preview MyClass
```

### 5. 处理异常

密钥派生可能抛出异常，要正确处理。`NoSuchAlgorithmException`表示算法不支持，`InvalidAlgorithmParameterException`表示参数无效。

```java
// 推荐：正确处理异常
public SecretKey deriveKeySafely(byte[] ikm, byte[] salt, byte[] info) {
    try {
        KDF kdf = KDF.getInstance("HKDF");
        HKDFParameterSpec.ExtractThenExpand spec = HKDFParameterSpec.ofExtract()
            .thenExpand(info, 256)
            .salt(salt)
            .ikm(ikm);
        return kdf.deriveKey("AES", spec);
    } catch (NoSuchAlgorithmException e) {
        // 算法不支持，可能是预览特性未启用
        throw new RuntimeException("HKDF算法不支持，请启用预览特性", e);
    } catch (InvalidAlgorithmParameterException e) {
        // 参数无效
        throw new RuntimeException("密钥派生参数无效", e);
    } catch (Exception e) {
        // 其他异常
        throw new RuntimeException("密钥派生失败", e);
    }
}
```

## 常见问题

### Q1: 密钥派生函数API什么时候会正式发布？

目前还是预览版，没有明确的时间表。等API稳定了，可能会正式发布。建议关注JDK更新，及时了解最新进展。

### Q2: 密钥派生函数API支持哪些算法？

目前只支持HKDF，未来可能会支持更多算法。API设计是通用的，可以扩展支持其他算法。

### Q3: 密钥派生函数API和PBKDF2有什么区别？

PBKDF2是老算法，虽然还能用，但安全性不如新算法。密钥派生函数API提供了统一的API，支持HKDF等新算法，安全性更好。

### Q4: 密钥派生函数API适合哪些场景？

适合密钥管理、密码加密、安全通信等场景。特别是需要从主密钥派生出多个子密钥的场景，用起来很方便。

### Q5: 如何启用预览特性？

需要在编译和运行时加上`--enable-preview`参数。Maven和Gradle也需要配置才能支持预览特性。

## 总结

密钥派生函数API（JEP 478）是JDK 24引入的一个预览特性，提供了统一的密钥派生函数API，支持HKDF算法，为量子安全做准备。虽然现在还是预览版，但已经能看到Java在朝着后量子密码学的方向发展了。

特别适合密钥管理、密码加密、安全通信等场景，特别是需要从主密钥派生出多个子密钥的场景，用起来很方便。

使用要注意使用强盐值、合适的上下文信息、足够的密钥长度、启用预览特性、处理异常。虽然现在只支持HKDF，但API设计是通用的，未来可能会支持更多量子安全的算法。

虽然现在是预览版，但已经能看到Java在朝着后量子密码学的方向发展了。兄弟们可以提前了解了解，等正式发布了就能直接用上了。量子安全是个长期工作，能提前准备就提前准备，等量子计算机普及了再准备就晚了。
