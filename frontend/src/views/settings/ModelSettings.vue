<template>
  <div class="min-h-screen bg-base-200 p-4 md:p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="bg-base-100 rounded-xl shadow-sm p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-base-content">模型配置管理</h1>
            <p class="text-base-content/70 mt-2">配置 AI 模型参数、API 提供商和任务分配</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button 
              class="btn btn-outline btn-sm"
              @click="testAllConnections"
              :disabled="loading"
            >
              <Icon v-if="!testing" icon="mdi:wifi" class="w-4 h-4" />
              <span v-else class="loading loading-spinner loading-xs"></span>
              {{ testing ? '测试中...' : '测试连接' }}
            </button>
            <button 
              class="btn btn-success btn-sm"
              @click="loadConfig"
              :disabled="loading"
            >
              <Icon v-if="!loading" icon="mdi:refresh" class="w-4 h-4" />
              <span v-else class="loading loading-spinner loading-xs"></span>
              {{ loading ? '加载中...' : '重新加载' }}
            </button>
            <button 
              class="btn btn-primary btn-sm"
              @click="saveConfig"
              :disabled="loading || !hasChanges"
            >
              <Icon icon="mdi:content-save" class="w-4 h-4" />
              保存设置
            </button>
          </div>
        </div>
      </div>

      <!-- API Providers Section -->
      <div class="bg-base-100 rounded-xl shadow-sm">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
                <Icon icon="mdi:server" class="w-6 h-6" />
                API 服务提供商
              </h2>
              <p class="text-base-content/70 text-sm mt-1">配置模型 API 服务商连接信息</p>
            </div>
            <button class="btn btn-primary btn-sm" @click="openAddProviderModal">
              <Icon icon="mdi:plus" class="w-4 h-4" />
              添加提供商
            </button>
          </div>
        </div>
        
        <div class="p-6">
          <div v-if="config?.api_providers?.length === 0" class="text-center py-8 text-base-content/50">
            <Icon icon="mdi:server-off" class="w-16 h-16 mx-auto mb-4 text-base-content/30" />
            <p>暂无API服务提供商</p>
          </div>
          
          <div v-else class="space-y-4">
            <div 
              v-for="(provider, index) in config?.api_providers" 
              :key="provider.name"
              class="card bg-base-200 border border-base-300"
            >
              <div class="card-body p-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div class="flex items-center gap-3">
                    <div class="avatar placeholder">
                      <div class="bg-sky-500 text-white rounded-lg w-12 h-12 relative">
                        <span class="text-lg font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">{{ provider.name.charAt(0) }}</span>
                      </div>
                    </div>
                    <div>
                      <h3 class="font-semibold text-base-content">{{ provider.name }}</h3>
                      <p class="text-sm text-base-content/70">{{ provider.base_url }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="badge" :class="getProviderStatusBadge(provider.name)">
                      {{ getProviderStatus(provider.name) }}
                    </div>
                    <button 
                      class="btn btn-ghost btn-sm"
                      @click="editProvider(provider, index)"
                    >
                      <Icon icon="mdi:pencil" class="w-4 h-4" />
                    </button>
                    <button 
                      class="btn btn-error btn-sm"
                      @click="deleteProvider(provider.name, index)"
                    >
                      <Icon icon="mdi:delete" class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 gap-4">
                  <div class="form-control">
                    <div class="label">
                      <span class="label-text font-medium w-24">基础 URL</span>
                    </div>
                    <input 
                      type="text" 
                      class="input input-bordered input-sm"
                      v-model="provider.base_url"
                      @input="markAsChanged"
                    />
                  </div>

                  <div class="form-control">
                    <div class="label">
                      <span class="label-text font-medium w-24">API 密钥</span>
                    </div>
                    <div class="join">
                      <input 
                        :type="showApiKeys[provider.name] ? 'text' : 'password'"
                        class="input input-bordered input-sm join-item flex-1"
                        v-model="provider.api_key"
                        @input="markAsChanged"
                        placeholder="输入 API 密钥"
                      />
                      <button 
                        type="button"
                        class="btn btn-ghost btn-sm join-item"
                        @click="toggleApiKeyVisibility(provider.name)"
                      >
                        <Icon 
                          :icon="showApiKeys[provider.name] ? 'mdi:eye-off' : 'mdi:eye'" 
                          class="w-4 h-4" 
                        />
                      </button>
                    </div>
                  </div>

                  <div class="form-control">
                    <div class="label">
                      <span class="label-text font-medium w-24">客户端类型</span>
                    </div>
                    <select 
                      class="select select-bordered select-sm"
                      v-model="provider.client_type"
                      @change="markAsChanged"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Gemini</option>
                    </select>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="form-control">
                      <div class="label">
                        <span class="label-text font-medium">最大重试次数</span>
                      </div>
                      <input 
                        type="number" 
                        class="input input-bordered input-sm"
                        v-model.number="provider.max_retry"
                        @input="markAsChanged"
                        min="0"
                        max="10"
                      />
                    </div>

                    <div class="form-control">
                      <div class="label">
                        <span class="label-text font-medium">超时时间（秒）</span>
                      </div>
                      <input 
                        type="number" 
                        class="input input-bordered input-sm"
                        v-model.number="provider.timeout"
                        @input="markAsChanged"
                        min="1"
                        max="300"
                      />
                    </div>

                    <div class="form-control">
                      <div class="label">
                        <span class="label-text font-medium">重试间隔（秒）</span>
                      </div>
                      <input 
                        type="number" 
                        class="input input-bordered input-sm"
                        v-model.number="provider.retry_interval"
                        @input="markAsChanged"
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Models Section -->
      <div class="bg-base-100 rounded-xl shadow-sm">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
                <Icon icon="mdi:brain" class="w-6 h-6" />
                模型配置
              </h2>
              <p class="text-base-content/70 text-sm mt-1">配置可用的 AI 模型及其参数</p>
            </div>
            <button class="btn btn-primary btn-sm" @click="openAddModelModal">
              <Icon icon="mdi:plus" class="w-4 h-4" />
              添加模型
            </button>
          </div>
        </div>
        
        <div class="p-6">
          <div v-if="config?.models?.length === 0" class="text-center py-8 text-base-content/50">
            <Icon icon="mdi:robot-outline" class="w-16 h-16 mx-auto mb-4 text-base-content/30" />
            <p>暂无配置的模型</p>
          </div>
          
          <div v-else class="space-y-4">
            <div 
              v-for="(model, index) in config?.models" 
              :key="model.name"
              class="card bg-base-200 border border-base-300"
            >
              <div class="card-body p-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div class="flex items-center gap-3">
                    <div class="avatar placeholder">
                      <div class="bg-sky-500 text-white rounded-lg w-12 h-12 relative">
                        <span class="text-lg font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">{{ model.name.charAt(0).toUpperCase() }}</span>
                      </div>
                    </div>
                    <div>
                      <h3 class="font-semibold text-base-content">{{ model.name }}</h3>
                      <p class="text-sm text-base-content/70">{{ model.model_identifier }}</p>
                      <div class="badge badge-outline badge-sm mt-1">{{ model.api_provider }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button 
                      class="btn btn-ghost btn-sm"
                      @click="editModel(model, index)"
                    >
                      <Icon icon="mdi:pencil" class="w-4 h-4" />
                    </button>
                    <button 
                      class="btn btn-error btn-sm"
                      @click="deleteModel(model.name, index)"
                    >
                      <Icon icon="mdi:delete" class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 gap-4">
                  <div class="form-control">
                    <div class="label">
                      <span class="label-text font-medium w-24">API 服务商</span>
                    </div>
                    <select 
                      class="select select-bordered select-sm"
                      v-model="model.api_provider"
                      @change="markAsChanged"
                    >
                      <option v-for="provider in config?.api_providers" :key="provider.name" :value="provider.name">
                        {{ provider.name }}
                      </option>
                    </select>
                  </div>

                  <div class="form-control">
                    <div class="label">
                      <span class="label-text font-medium w-24">模型标识符</span>
                      <span class="label-text-alt text-xs">{{ loadingModels ? '加载中...' : `共 ${getModelsForProvider(model.api_provider).length} 个模型` }}</span>
                    </div>
                    <div class="relative">
                      <input 
                        type="text" 
                        class="input input-bordered input-sm w-full"
                        v-model="model.model_identifier"
                        @input="markAsChanged"
                        placeholder="搜索或输入模型标识符"
                        @focus="showDropdown(model.name)"
                        @blur="hideDropdown()"
                        :disabled="!model.api_provider"
                      />
                      <Icon 
                        icon="mdi:magnify" 
                        class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" 
                      />
                      
                      <!-- 模型下拉列表 -->
                      <div 
                        v-if="activeDropdownModel === model.name && model.model_identifier && model.api_provider && getModelsForProvider(model.api_provider, model.model_identifier).length > 0" 
                        class="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-base-100 border border-base-300 rounded-lg shadow-lg"
                      >
                        <div 
                          v-for="modelId in getModelsForProvider(model.api_provider, model.model_identifier)" 
                          :key="modelId"
                          class="px-3 py-2 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
                          @mousedown="selectModelForEdit(model, modelId)"
                        >
                          <div class="font-mono text-xs">{{ modelId }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="form-control">
                    <div class="label">
                      <span class="label-text font-medium w-24">模型名称</span>
                    </div>
                    <input 
                      type="text" 
                      class="input input-bordered input-sm"
                      v-model="model.name"
                      @input="markAsChanged"
                    />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-control">
                      <div class="label">
                        <span class="label-text font-medium">输入价格 (元/M token)</span>
                      </div>
                      <input 
                        type="number" 
                        class="input input-bordered input-sm"
                        v-model.number="model.price_in"
                        @input="markAsChanged"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div class="form-control">
                      <div class="label">
                        <span class="label-text font-medium">输出价格 (元/M token)</span>
                      </div>
                      <input 
                        type="number" 
                        class="input input-bordered input-sm"
                        v-model.number="model.price_out"
                        @input="markAsChanged"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-control">
                      <label class="label cursor-pointer justify-start gap-3">
                        <input 
                          type="checkbox" 
                          class="checkbox checkbox-primary"
                          v-model="model.force_stream_mode"
                          @change="markAsChanged"
                        />
                        <span class="label-text font-medium">强制流式输出模式</span>
                      </label>
                    </div>

                    <div class="form-control">
                      <label class="label cursor-pointer justify-start gap-3">
                        <input 
                          type="checkbox" 
                          class="checkbox checkbox-primary"
                          :checked="model.extra_params?.enable_thinking || false"
                          @change="updateModelThinking(model, $event)"
                        />
                        <span class="label-text font-medium">启用思考模式</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Model Task Configuration Section -->
      <div class="bg-base-100 rounded-xl shadow-sm">
        <div class="p-6 border-b border-base-300">
          <div>
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:cog" class="w-6 h-6" />
              任务模型分配
            </h2>
            <p class="text-base-content/70 text-sm mt-1">为不同任务分配合适的模型和参数</p>
          </div>
        </div>
        
        <div class="p-6">
          <div class="space-y-6" v-if="config">
            <div 
              v-for="taskType in taskConfigTypes" 
              :key="taskType.key"
              class="card bg-base-200 border border-base-300"
            >
              <div class="card-body p-4">
                <div class="mb-4">
                  <h3 class="font-semibold text-base-content">{{ taskType.label }}</h3>
                  <p class="text-sm text-base-content/70">{{ taskType.description }}</p>
                </div>

                <div class="grid grid-cols-1 gap-4">
                  <div class="form-control">
                    <div class="label">
                      <span class="label-text font-medium w-24">使用的模型</span>
                    </div>
                    <select 
                      class="select select-bordered select-sm"
                      v-model="config.model_task_config[taskType.key].model_list[0]"
                      @change="markAsChanged"
                    >
                      <option value="">请选择模型</option>
                      <option v-for="model in config.models" :key="model.name" :value="model.name">
                        {{ model.name }} ({{ model.api_provider }})
                      </option>
                    </select>
                  </div>

                  <div class="form-control" v-if="config.model_task_config[taskType.key].temperature !== undefined">
                    <div class="label">
                      <span class="label-text font-medium w-24">温度参数</span>
                      <span class="label-text-alt font-mono min-w-[3rem] text-right">{{ (config.model_task_config[taskType.key].temperature || 0).toFixed(1) }}</span>
                    </div>
                    <div class="px-2">
                      <input 
                        type="range" 
                        class="range range-primary range-sm w-full"
                        v-model.number="config.model_task_config[taskType.key].temperature"
                        @input="markAsChanged"
                        min="0"
                        max="2"
                        step="0.1"
                      />
                      <div class="flex justify-between text-xs mt-1">
                        <span class="text-left flex-1">保守 (0)</span>
                        <span class="text-center flex-1">平衡 (1)</span>
                        <span class="text-right flex-1">创造 (2)</span>
                      </div>
                    </div>
                  </div>

                  <div class="form-control" v-if="config.model_task_config[taskType.key].max_tokens !== undefined">
                    <div class="label">
                      <span class="label-text font-medium w-24">最大输出 Token 数</span>
                    </div>
                    <input 
                      type="number" 
                      class="input input-bordered input-sm"
                      v-model.number="config.model_task_config[taskType.key].max_tokens"
                      @input="markAsChanged"
                      min="1"
                      max="8192"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-8 text-base-content/50">
            <Icon icon="mdi:cog" class="w-16 h-16 mx-auto mb-4 text-base-content/30 animate-spin" />
            <p>正在加载配置...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Provider Modal -->
    <dialog ref="addProviderModal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
          <Icon icon="mdi:server-plus" class="w-6 h-6 text-primary" />
          添加 API 服务提供商
        </h3>
        <form @submit.prevent="addProvider">
          <div class="space-y-4">
            <div class="form-control">
              <div class="label">
                <span class="label-text font-medium w-28">名称 *</span>
              </div>
              <input 
                type="text" 
                class="input input-bordered"
                v-model="newProvider.name"
                placeholder="例如：DeepSeek"
                required
              />
            </div>

            <div class="form-control">
              <div class="label">
                <span class="label-text font-medium w-28">基础 URL *</span>
              </div>
              <input 
                type="url" 
                class="input input-bordered"
                v-model="newProvider.base_url"
                placeholder="例如：https://api.deepseek.cn/v1"
                required
              />
            </div>

            <div class="form-control">
              <div class="label">
                <span class="label-text font-medium w-28">API 密钥 *</span>
              </div>
              <input 
                type="password" 
                class="input input-bordered"
                v-model="newProvider.api_key"
                placeholder="输入 API 密钥"
                required
              />
            </div>

            <div class="form-control">
              <div class="label">
                <span class="label-text font-medium w-28">客户端类型</span>
              </div>
              <select class="select select-bordered" v-model="newProvider.client_type">
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>

            <div class="form-control">
              <div class="label">
                <span class="label-text font-medium w-28">最大重试次数</span>
              </div>
              <input 
                type="number" 
                class="input input-bordered"
                v-model.number="newProvider.max_retry"
                min="0"
                max="10"
              />
            </div>

            <div class="form-control">
              <div class="label">
                <span class="label-text font-medium w-28">超时时间（秒）</span>
              </div>
              <input 
                type="number" 
                class="input input-bordered"
                v-model.number="newProvider.timeout"
                min="1"
                max="300"
              />
            </div>

            <div class="form-control">
              <div class="label">
                <span class="label-text font-medium w-28">重试间隔（秒）</span>
              </div>
              <input 
                type="number" 
                class="input input-bordered"
                v-model.number="newProvider.retry_interval"
                min="1"
                max="60"
              />
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeAddProviderModal">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="!isProviderValid">添加</button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Add Model Modal -->
    <dialog ref="addModelModal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
          <Icon icon="mdi:brain" class="w-6 h-6 text-secondary" />
          添加模型配置
        </h3>
        <form @submit.prevent="addModel">
          <div class="space-y-4">
            <div class="form-control">
              <div class="label">
                <span class="label-text font-medium w-32">API 服务商 *</span>
              </div>
              <select class="select select-bordered" v-model="newModel.api_provider" required>
                <option value="">请选择服务商</option>
                <option v-for="provider in config?.api_providers" :key="provider.name" :value="provider.name">
                  {{ provider.name }}
                </option>
              </select>
            </div>

            <!-- 模型标识符搜索框 -->
            <div class="form-control">
              <div class="label">
                <span class="label-text font-medium w-32">模型标识符 *</span>
                <span class="label-text-alt">{{ loadingModels ? '加载中...' : `共 ${getModelsForProvider(newModel.api_provider).length} 个模型` }}</span>
              </div>
              <div class="relative">
                <input 
                  type="text" 
                  class="input input-bordered w-full"
                  v-model="modelSearchQuery"
                  @input="newModel.model_identifier = modelSearchQuery"
                  placeholder="搜索或输入模型标识符，如: deepseek-ai/DeepSeek-R1"
                  required
                  :disabled="!newModel.api_provider"
                />
                <Icon 
                  icon="mdi:magnify" 
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" 
                />
                
                <!-- 模型下拉列表 -->
                <div 
                  v-if="modelSearchQuery && newModel.api_provider && getModelsForProvider(newModel.api_provider, modelSearchQuery).length > 0" 
                  class="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-base-100 border border-base-300 rounded-lg shadow-lg"
                >
                  <div 
                    v-for="model in getModelsForProvider(newModel.api_provider, modelSearchQuery)" 
                    :key="model"
                    class="px-4 py-2 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
                    @click="selectModel(model)"
                  >
                    <div class="font-mono text-sm">{{ model }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-control">
              <div class="label">
                <span class="label-text font-medium w-32">模型名称 *</span>
              </div>
              <input 
                type="text" 
                class="input input-bordered"
                v-model="newModel.name"
                placeholder="例如：deepseek-v3"
                required
              />
            </div>

            <div class="form-control">
              <div class="label">
                <span class="label-text font-medium w-32">输入价格 (元/M token)</span>
              </div>
              <input 
                type="number" 
                class="input input-bordered"
                v-model.number="newModel.price_in"
                min="0"
                step="0.1"
              />
            </div>

            <div class="form-control">
              <div class="label">
                <span class="label-text font-medium w-32">输出价格 (元/M token)</span>
              </div>
              <input 
                type="number" 
                class="input input-bordered"
                v-model.number="newModel.price_out"
                min="0"
                step="0.1"
              />
            </div>

            <div class="form-control">
              <label class="label cursor-pointer justify-start gap-3">
                <input type="checkbox" class="checkbox checkbox-primary" v-model="newModel.force_stream_mode" />
                <span class="label-text font-medium">强制流式输出模式</span>
              </label>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer justify-start gap-3">
                <input type="checkbox" class="checkbox checkbox-primary" :checked="newModel.extra_params?.enable_thinking || false" @change="updateNewModelThinking($event)" />
                <span class="label-text font-medium">启用思考模式</span>
              </label>
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeAddModelModal">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="!isModelValid">添加</button>
          </div>
        </form>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import ModelConfigApi from '@/utils/modelConfigApi'
import type { 
  ModelConfig, 
  ApiProvider, 
  Model, 
  AddProviderRequest, 
  AddModelRequest
} from '@/types/modelConfig'
import { TASK_CONFIG_TYPES } from '@/types/modelConfig'

// 响应式数据
const config = ref<ModelConfig | null>(null)
const loading = ref(false)
const testing = ref(false)
const hasChanges = ref(false)
const showApiKeys = ref<Record<string, boolean>>({})
const providerStatuses = ref<Record<string, 'connected' | 'error' | 'unknown'>>({})

// 模态框引用
const addProviderModal = ref<HTMLDialogElement>()
const addModelModal = ref<HTMLDialogElement>()

// 新增数据
const newProvider = reactive<AddProviderRequest>({
  name: '',
  base_url: '',
  api_key: '',
  client_type: 'openai',
  max_retry: 2,
  timeout: 30,
  retry_interval: 10
})

const newModel = reactive<AddModelRequest>({
  model_identifier: '',
  name: '',
  api_provider: '',
  price_in: 0,
  price_out: 0,
  force_stream_mode: false,
  extra_params: {
    enable_thinking: false
  }
})

// 获取模型相关状态
const availableModels = ref<string[]>([])
const loadingModels = ref(false)
const allModelsFromProviders = ref<Record<string, string[]>>({})
const allModels = ref<string[]>([])
const modelSearchQuery = ref('')
const activeDropdownModel = ref<string | null>(null)

// 任务配置类型
const taskConfigTypes = TASK_CONFIG_TYPES

// 消息提示函数
const showMessage = (type: 'success' | 'error' | 'info', message: string) => {
  // 创建toast消息
  const toast = document.createElement('div')
  toast.className = `toast toast-top toast-end`
  
  const alert = document.createElement('div')
  alert.className = `alert ${
    type === 'success' ? 'alert-success' : 
    type === 'error' ? 'alert-error' : 
    'alert-info'
  }`
  alert.textContent = message
  
  toast.appendChild(alert)
  document.body.appendChild(toast)
  
  // 3秒后自动移除
  setTimeout(() => {
    document.body.removeChild(toast)
  }, 3000)
}

const showConfirm = (message: string, title: string = '确认'): Promise<boolean> => {
  return new Promise((resolve) => {
    const isConfirmed = window.confirm(`${title}\n\n${message}`)
    resolve(isConfirmed)
  })
}

// 计算属性
const isProviderValid = computed(() => {
  return newProvider.name && newProvider.base_url && newProvider.api_key
})

const isModelValid = computed(() => {
  return newModel.model_identifier && newModel.name && newModel.api_provider
})

// 方法
const markAsChanged = () => {
  hasChanges.value = true
}

const updateModelThinking = (model: Model, event: Event) => {
  const target = event.target as HTMLInputElement
  if (!model.extra_params) {
    model.extra_params = {}
  }
  model.extra_params.enable_thinking = target.checked
  markAsChanged()
}

const updateNewModelThinking = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!newModel.extra_params) {
    newModel.extra_params = {}
  }
  newModel.extra_params.enable_thinking = target.checked
}

const toggleApiKeyVisibility = (providerName: string) => {
  showApiKeys.value[providerName] = !showApiKeys.value[providerName]
}

const getProviderStatus = (providerName: string): string => {
  const status = providerStatuses.value[providerName]
  switch (status) {
    case 'connected': return '已连接'
    case 'error': return '连接失败'
    default: return '未知'
  }
}

const getProviderStatusBadge = (providerName: string): string => {
  const status = providerStatuses.value[providerName]
  switch (status) {
    case 'connected': return 'badge-success'
    case 'error': return 'badge-error'
    default: return 'badge-ghost'
  }
}

const loadConfig = async () => {
  try {
    loading.value = true
    config.value = await ModelConfigApi.getCurrentConfig()
    hasChanges.value = false
    
    // 初始化显示状态
    if (config.value?.api_providers) {
      config.value.api_providers.forEach(provider => {
        showApiKeys.value[provider.name] = false
        providerStatuses.value[provider.name] = 'unknown'
      })
      
      // 自动获取所有提供商的模型列表
      await loadAllModelsFromProviders()
    }
  } catch (error) {
    showMessage('error', '加载配置失败')
    console.error('Load config error:', error)
  } finally {
    loading.value = false
  }
}

const loadAllModelsFromProviders = async () => {
  if (!config.value?.api_providers.length) return
  
  loadingModels.value = true
  const allModelsSet = new Set<string>()
  
  for (const provider of config.value.api_providers) {
    try {
      const models = await ModelConfigApi.getModels({
        api_url: provider.base_url,
        api_key: provider.api_key
      })
      
      allModelsFromProviders.value[provider.name] = models
      models.forEach(model => allModelsSet.add(model))
      
      console.log(`从 ${provider.name} 获取到 ${models.length} 个模型`)
    } catch (error) {
      console.error(`从 ${provider.name} 获取模型失败:`, error)
      allModelsFromProviders.value[provider.name] = []
    }
  }
  
  allModels.value = Array.from(allModelsSet).sort()
  loadingModels.value = false
  
  if (allModels.value.length > 0) {
    showMessage('success', `成功获取到 ${allModels.value.length} 个模型`)
  } else {
    showMessage('error', '未能获取到任何模型，请检查API配置')
  }
}

const saveConfig = async () => {
  if (!config.value) return
  
  try {
    loading.value = true
    await ModelConfigApi.updateConfig(config.value)
    hasChanges.value = false
    showMessage('success', '保存成功')
  } catch (error) {
    showMessage('error', '保存失败')
    console.error('Save config error:', error)
  } finally {
    loading.value = false
  }
}

const testAllConnections = async () => {
  if (!config.value?.api_providers) return
  
  testing.value = true
  
  for (const provider of config.value.api_providers) {
    try {
      const connected = await ModelConfigApi.testProviderConnection(provider.name)
      providerStatuses.value[provider.name] = connected ? 'connected' : 'error'
    } catch (error) {
      providerStatuses.value[provider.name] = 'error'
    }
  }
  
  testing.value = false
  showMessage('success', '连接测试完成')
}

// Provider management
const openAddProviderModal = () => {
  resetNewProvider()
  addProviderModal.value?.showModal()
}

const closeAddProviderModal = () => {
  addProviderModal.value?.close()
}

const resetNewProvider = () => {
  Object.assign(newProvider, {
    name: '',
    base_url: '',
    api_key: '',
    client_type: 'openai',
    max_retry: 2,
    timeout: 30,
    retry_interval: 10
  })
}

const addProvider = async () => {
  try {
    await ModelConfigApi.addProvider(newProvider)
    if (config.value) {
      config.value.api_providers.push({ ...newProvider })
      showApiKeys.value[newProvider.name] = false
      providerStatuses.value[newProvider.name] = 'unknown'
      markAsChanged()
    }
    closeAddProviderModal()
    showMessage('success', '添加成功')
  } catch (error) {
    showMessage('error', '添加失败')
    console.error('Add provider error:', error)
  }
}

const editProvider = (_provider: ApiProvider, _index: number) => {
  // 编辑功能可以后续实现
  showMessage('info', '编辑功能开发中')
}

const deleteProvider = async (name: string, index: number) => {
  try {
    const confirmed = await showConfirm(`确定要删除提供商"${name}"吗？`, '确认删除')
    if (!confirmed) return
    
    await ModelConfigApi.deleteProvider({ name })
    if (config.value) {
      config.value.api_providers.splice(index, 1)
      delete showApiKeys.value[name]
      delete providerStatuses.value[name]
      markAsChanged()
    }
    showMessage('success', '删除成功')
  } catch (error) {
    showMessage('error', '删除失败')
    console.error('Delete provider error:', error)
  }
}

// Model management
const openAddModelModal = () => {
  resetNewModel()
  addModelModal.value?.showModal()
}

const closeAddModelModal = () => {
  addModelModal.value?.close()
}

const resetNewModel = () => {
  Object.assign(newModel, {
    model_identifier: '',
    name: '',
    api_provider: '',
    price_in: 0,
    price_out: 0,
    force_stream_mode: false,
    extra_params: {
      enable_thinking: false
    }
  })
  availableModels.value = []
  modelSearchQuery.value = ''
}

const selectModel = (modelId: string) => {
  newModel.model_identifier = modelId
  // 自动生成模型名称（移除前缀，保留主要部分）
  const modelName = modelId.split('/').pop() || modelId
  newModel.name = modelName
  modelSearchQuery.value = modelId // 更新搜索框显示选中的模型
}

// 为编辑中的模型获取该API服务商的模型列表
const getModelsForProvider = (providerName: string, query: string = ''): string[] => {
  if (!providerName || !allModelsFromProviders.value[providerName]) return []
  
  const providerModels = allModelsFromProviders.value[providerName]
  
  if (!query) return providerModels // 没有查询时返回所有模型
  
  const lowerQuery = query.toLowerCase()
  return providerModels.filter(model => 
    model.toLowerCase().includes(lowerQuery)
  )
}

// 为编辑中的模型选择模型ID
const selectModelForEdit = (model: Model, modelId: string) => {
  model.model_identifier = modelId
  activeDropdownModel.value = null
  markAsChanged()
}

// 显示/隐藏下拉框
const showDropdown = (modelName: string) => {
  activeDropdownModel.value = modelName
}

const hideDropdown = () => {
  setTimeout(() => {
    activeDropdownModel.value = null
  }, 200)
}

const addModel = async () => {
  try {
    await ModelConfigApi.addModel(newModel)
    if (config.value) {
      config.value.models.push({ ...newModel })
      markAsChanged()
    }
    closeAddModelModal()
    showMessage('success', '添加成功')
  } catch (error) {
    showMessage('error', '添加失败')
    console.error('Add model error:', error)
  }
}

const editModel = (_model: Model, _index: number) => {
  // 编辑功能可以后续实现
  showMessage('info', '编辑功能开发中')
}

const deleteModel = async (name: string, index: number) => {
  try {
    const confirmed = await showConfirm(`确定要删除模型"${name}"吗？`, '确认删除')
    if (!confirmed) return
    
    await ModelConfigApi.deleteModel({ name })
    if (config.value) {
      config.value.models.splice(index, 1)
      markAsChanged()
    }
    showMessage('success', '删除成功')
  } catch (error) {
    showMessage('error', '删除失败')
    console.error('Delete model error:', error)
  }
}

// 生命周期
onMounted(() => {
  loadConfig()
})
</script>
