import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';

describe('Product Config', () => {
  let adminCaller: ReturnType<typeof appRouter.createCaller>;
  let userCaller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    // 创建管理员调用者
    adminCaller = appRouter.createCaller({
      user: {
        id: 1,
        openId: 'admin123',
        name: 'Admin',
        role: 'admin',
        createdAt: Date.now(),
        language: 'zh',
      },
    });

    // 创建普通用户调用者
    userCaller = appRouter.createCaller({
      user: {
        id: 2,
        openId: 'user123',
        name: 'User',
        role: 'user',
        createdAt: Date.now(),
        language: 'zh',
      },
    });
  });

  describe('initDefaults', () => {
    it('should initialize default product configurations', async () => {
      const result = await adminCaller.productConfig.initDefaults();
      expect(result.success).toBe(true);

      // 验证默认配置已创建
      const configs = await db.getAllProductConfigs();
      expect(configs.length).toBeGreaterThan(0);
    });

    it('should not allow non-admin to initialize defaults', async () => {
      await expect(userCaller.productConfig.initDefaults()).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should list all product configurations for admin', async () => {
      // 先初始化默认配置
      await adminCaller.productConfig.initDefaults();

      const configs = await adminCaller.productConfig.list();
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
    });

    it('should not allow non-admin to list configurations', async () => {
      await expect(userCaller.productConfig.list()).rejects.toThrow();
    });
  });

  describe('getByKey', () => {
    it('should get configuration by key', async () => {
      // 先初始化默认配置
      await adminCaller.productConfig.initDefaults();

      // 获取糖度配置
      const sugarConfig = await adminCaller.productConfig.getByKey({
        configKey: 'sugar_options',
      });

      expect(sugarConfig).toBeDefined();
      if (sugarConfig) {
        expect(sugarConfig.configKey).toBe('sugar_options');
        expect(sugarConfig.configType).toBe('sugar');
      }
    });

    it('should return null for non-existent key', async () => {
      const config = await adminCaller.productConfig.getByKey({
        configKey: 'non_existent_key',
      });
      expect(config).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new product configuration', async () => {
      const uniqueKey = `test_config_${Date.now()}`;
      const newConfig = await adminCaller.productConfig.create({
        configKey: uniqueKey,
        nameZh: '测试配置',
        nameRu: 'Тестовая конфигурация',
        nameEn: 'Test Config',
        configType: 'other',
        configValue: JSON.stringify({ test: true }),
        isActive: true,
        sortOrder: 100,
      });

      expect(newConfig.id).toBeDefined();
      expect(newConfig.configKey).toBe(uniqueKey);
    });

    it('should not allow non-admin to create configuration', async () => {
      await expect(
        userCaller.productConfig.create({
          configKey: 'test_config',
          nameZh: '测试配置',
          nameRu: 'Тестовая конфигурация',
          nameEn: 'Test Config',
          configType: 'other',
          configValue: JSON.stringify({ test: true }),
        })
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update an existing product configuration', async () => {
      // 先创建一个配置
      const uniqueKey = `update_test_${Date.now()}`;
      const created = await adminCaller.productConfig.create({
        configKey: uniqueKey,
        nameZh: '更新测试',
        nameRu: 'Тест обновления',
        nameEn: 'Update Test',
        configType: 'other',
        configValue: JSON.stringify({ value: 1 }),
      });

      // 更新配置
      const result = await adminCaller.productConfig.update({
        id: created.id,
        configValue: JSON.stringify({ value: 2 }),
        isActive: false,
      });

      expect(result.success).toBe(true);

      // 验证更新
      const updated = await db.getProductConfigByKey(uniqueKey);
      expect(updated).toBeDefined();
      if (updated) {
        const value = JSON.parse(updated.configValue as string);
        expect(value.value).toBe(2);
        expect(updated.isActive).toBe(false);
      }
    });

    it('should not allow non-admin to update configuration', async () => {
      await expect(
        userCaller.productConfig.update({
          id: 1,
          configValue: JSON.stringify({ test: true }),
        })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a product configuration', async () => {
      // 先创建一个配置
      const uniqueKey = `delete_test_${Date.now()}`;
      const created = await adminCaller.productConfig.create({
        configKey: uniqueKey,
        nameZh: '删除测试',
        nameRu: 'Тест удаления',
        nameEn: 'Delete Test',
        configType: 'other',
        configValue: JSON.stringify({ test: true }),
      });

      // 删除配置
      const result = await adminCaller.productConfig.delete({
        id: created.id,
      });

      expect(result.success).toBe(true);

      // 验证删除
      const deleted = await db.getProductConfigByKey(uniqueKey);
      expect(deleted).toBeNull();
    });

    it('should not allow non-admin to delete configuration', async () => {
      await expect(
        userCaller.productConfig.delete({ id: 1 })
      ).rejects.toThrow();
    });
  });

  describe('getMerged', () => {
    it('should get merged configuration for a product', async () => {
      // 先初始化默认配置
      await adminCaller.productConfig.initDefaults();

      // 获取商品1的合并配置
      const merged = await adminCaller.productConfig.getMerged({
        productId: 1,
      });

      expect(merged).toBeDefined();
      expect(Array.isArray(merged)).toBe(true);
      expect(merged.length).toBeGreaterThan(0);
      
      // 检查是否有不同类型的配置
      const configTypes = merged.map(c => c.configType);
      expect(configTypes).toContain('sugar');
    });
  });

  describe('setProductConfig', () => {
    it('should set product-specific configuration', async () => {
      const result = await adminCaller.productConfig.setProductConfig({
        productId: 1,
        configKey: 'sugar_options',
        configValue: JSON.stringify({ custom: true }),
        isActive: true,
      });

      expect(result.success).toBe(true);
    });

    it('should not allow non-admin to set product configuration', async () => {
      await expect(
        userCaller.productConfig.setProductConfig({
          productId: 1,
          configKey: 'sugar_options',
          configValue: JSON.stringify({ custom: true }),
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteProductConfig', () => {
    it('should delete product-specific configuration', async () => {
      // 先设置一个商品特定配置
      await adminCaller.productConfig.setProductConfig({
        productId: 1,
        configKey: 'test_config',
        configValue: JSON.stringify({ test: true }),
      });

      // 删除配置
      const result = await adminCaller.productConfig.deleteProductConfig({
        productId: 1,
        configKey: 'test_config',
      });

      expect(result.success).toBe(true);
    });

    it('should not allow non-admin to delete product configuration', async () => {
      await expect(
        userCaller.productConfig.deleteProductConfig({
          productId: 1,
          configKey: 'test_config',
        })
      ).rejects.toThrow();
    });
  });
});
