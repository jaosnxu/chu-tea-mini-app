# CHU TEA Telegram Bot 配置指南

## 问题说明

如果您在 Telegram 中打开小程序时看到 "The temporary website is currently unavailable" 错误，这是因为使用了临时开发地址。

## 解决方案

### 步骤 1：发布项目获得永久域名

1. **在 Manus 对话界面**，找到右侧的管理面板（Management UI）
   - 如果看不到，点击聊天界面右上角的图标打开

2. **点击 "Dashboard" 标签页**

3. **在页面顶部找到 "Publish" 按钮**（通常在右上角）

4. **点击 Publish 发布项目**
   - 系统会自动生成一个永久域名，格式如：`chu-tea-xxxxx.manus.space`
   - 这个域名不会因为沙箱休眠而失效

### 步骤 2：配置 Telegram Bot

#### 方法 A：使用 BotFather 配置 Menu Button

1. **打开 Telegram，搜索 @BotFather**

2. **发送命令：**
   ```
   /mybots
   ```

3. **选择您的 "CHU TEA bot"**

4. **选择 "Bot Settings" → "Menu Button" → "Configure Menu Button"**

5. **输入您的永久域名：**
   ```
   https://chu-tea-xxxxx.manus.space
   ```
   （替换为您实际获得的域名）

6. **输入按钮文字（可选）：**
   ```
   打开小程序
   ```

#### 方法 B：使用 /setmenubutton 命令

1. **在 BotFather 中发送：**
   ```
   /setmenubutton
   ```

2. **选择您的 bot**

3. **输入永久域名**

4. **输入按钮文字**

### 步骤 3：测试

1. **返回您的 CHU TEA bot**

2. **点击底部的菜单按钮**（通常在输入框左侧）

3. **小程序应该能正常打开了**

## 当前临时地址（仅供开发测试）

```
https://3000-ijqd63o4b170xv1817uy2-470beca2.us2.manus.computer
```

⚠️ **注意：** 这个地址会在沙箱休眠后失效，不适合正式使用。

## 常见问题

### Q: 发布后域名在哪里查看？
A: 在 Manus 管理界面的 Dashboard 页面，或者 Settings → Domains 页面。

### Q: 可以使用自定义域名吗？
A: 可以！在 Settings → Domains 中可以绑定您自己的域名。

### Q: 发布后如何更新？
A: 每次修改代码后，保存新的 checkpoint，然后再次点击 Publish 即可。

### Q: 小程序打开后是空白页？
A: 检查浏览器控制台是否有错误，可能是 OAuth 配置问题。确保在 Manus 中正确配置了 OAuth 回调地址。

## 技术支持

如有问题，请访问：https://help.manus.im
