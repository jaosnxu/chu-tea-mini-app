import { getIikoConfigById, updateIikoConfig } from "./iiko-db.js";

/**
 * IIKO API 认证服务
 * 根据 IIKO Cloud API 文档实现
 */

interface IikoAuthResponse {
  token: string;
  expiresIn: number; // seconds
}

/**
 * 获取 IIKO 访问令牌
 * @param configId IIKO 配置 ID
 * @returns 访问令牌
 */
export async function getIikoAccessToken(configId: number): Promise<string | null> {
  const config = await getIikoConfigById(configId);
  if (!config) {
    throw new Error(`IIKO config not found: ${configId}`);
  }

  // 检查现有令牌是否有效
  if (config.accessToken && config.tokenExpiresAt) {
    const now = new Date();
    const expiresAt = new Date(config.tokenExpiresAt);
    // 如果令牌还有 5 分钟以上有效期，直接返回
    if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
      return config.accessToken;
    }
  }

  // 令牌已过期或不存在，重新获取
  try {
    const response = await fetch(`${config.apiUrl}/api/1/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiLogin: config.apiLogin,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IIKO auth failed: ${response.status} ${errorText}`);
    }

    const data: IikoAuthResponse = await response.json();

    // 保存令牌到数据库
    const expiresAt = new Date(Date.now() + data.expiresIn * 1000);
    await updateIikoConfig(configId, {
      accessToken: data.token,
      tokenExpiresAt: expiresAt,
    });

    return data.token;
  } catch (error) {
    console.error(`[IIKO Auth] Failed to get access token for config ${configId}:`, error);
    return null;
  }
}

/**
 * 测试 IIKO 连接
 * @param apiUrl IIKO API URL
 * @param apiLogin IIKO API Login
 * @returns 测试结果
 */
export async function testIikoConnection(apiUrl: string, apiLogin: string): Promise<{
  success: boolean;
  message: string;
  token?: string;
}> {
  try {
    const response = await fetch(`${apiUrl}/api/1/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiLogin,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `连接失败: ${response.status} ${errorText}`,
      };
    }

    const data: IikoAuthResponse = await response.json();

    return {
      success: true,
      message: "连接成功！",
      token: data.token,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `连接失败: ${error.message}`,
    };
  }
}

/**
 * 获取组织信息
 * @param configId IIKO 配置 ID
 * @returns 组织信息
 */
export async function getIikoOrganizations(configId: number) {
  const token = await getIikoAccessToken(configId);
  if (!token) {
    throw new Error("Failed to get IIKO access token");
  }

  const config = await getIikoConfigById(configId);
  if (!config) {
    throw new Error(`IIKO config not found: ${configId}`);
  }

  try {
    const response = await fetch(`${config.apiUrl}/api/1/organizations`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get organizations: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.organizations || [];
  } catch (error) {
    console.error(`[IIKO Auth] Failed to get organizations for config ${configId}:`, error);
    throw error;
  }
}

/**
 * 获取终端组信息
 * @param configId IIKO 配置 ID
 * @returns 终端组信息
 */
export async function getIikoTerminalGroups(configId: number) {
  const token = await getIikoAccessToken(configId);
  if (!token) {
    throw new Error("Failed to get IIKO access token");
  }

  const config = await getIikoConfigById(configId);
  if (!config) {
    throw new Error(`IIKO config not found: ${configId}`);
  }

  try {
    const response = await fetch(`${config.apiUrl}/api/1/terminal_groups`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationIds: [config.organizationId],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get terminal groups: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.terminalGroups || [];
  } catch (error) {
    console.error(`[IIKO Auth] Failed to get terminal groups for config ${configId}:`, error);
    throw error;
  }
}
