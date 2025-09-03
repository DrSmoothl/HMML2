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
              class="card border border-base-300"
              :class="getTaskCardClass(taskType.key)"
            >
              <div class="card-body p-4">
                <div class="mb-4">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="flex items-center justify-center w-8 h-8 rounded-lg" :class="getTaskIconClass(taskType.key)">
                      <Icon :icon="getTaskIcon(taskType.key)" class="w-5 h-5" />
                    </div>
                    <div>
                      <h3 class="font-semibold text-base-content">{{ taskType.label }}</h3>
                      <div class="badge badge-outline badge-xs" :class="getTaskTypeClass(taskType.key)">
                        {{ getTaskCategory(taskType.key) }}
                      </div>
                    </div>
                  </div>
                  <p class="text-sm text-base-content/70">{{ taskType.description }}</p>
                </div>

                <div class="grid grid-cols-1 gap-4">
                  <div class="form-control">
                    <div class="label">
                      <span class="label-text font-medium">使用的模型</span>
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

                  <!-- 温度参数 - 仅对需要的任务类型显示 -->
                  <div class="form-control" v-if="shouldShowTemperature(taskType.key) && config.model_task_config[taskType.key].temperature !== undefined">
                    <div class="label">
                      <span class="label-text font-medium">温度参数</span>
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
                    <!-- 针对特定任务类型的温度建议 -->
                    <div class="text-xs text-base-content/60 mt-1" v-if="getTemperatureRecommendation(taskType.key)">
                      <Icon icon="mdi:lightbulb-outline" class="inline w-3 h-3 mr-1" />
                      {{ getTemperatureRecommendation(taskType.key) }}
                    </div>
                  </div>

                  <!-- 最大Token数 - 仅对需要的任务类型显示 -->
                  <div class="form-control" v-if="shouldShowMaxTokens(taskType.key) && config.model_task_config[taskType.key].max_tokens !== undefined">
                    <div class="label">
                      <span class="label-text font-medium">最大输出 Token 数</span>
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

                  <!-- 特殊配置提示 -->
                  <div v-if="getSpecialConfigNote(taskType.key)" class="alert alert-info">
                    <Icon icon="mdi:information-outline" />
                    <div>
                      <h4 class="font-bold">配置说明</h4>
                      <div class="text-sm">{{ getSpecialConfigNote(taskType.key) }}</div>
                    </div>
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

// 任务配置相关方法
const shouldShowTemperature = (taskKey: string): boolean => {
  // 这些任务类型不需要温度参数
  const noTemperatureTasks = ['vlm', 'voice', 'embedding']
  return !noTemperatureTasks.includes(taskKey)
}

const shouldShowMaxTokens = (taskKey: string): boolean => {
  // 这些任务类型不需要max_tokens参数
  const noMaxTokensTasks = ['voice', 'embedding']
  return !noMaxTokensTasks.includes(taskKey)
}

const getTemperatureRecommendation = (taskKey: string): string => {
  const recommendations: Record<string, string> = {
    'utils': '建议 0.1-0.3，确保麦麦功能组件稳定运行',
    'replyer': '建议 0.1-0.3，保证回复质量一致性',
    'planner': '建议 0.3，平衡决策准确性和灵活性',
    'planner_small': '建议 0.3，保持副决策的合理性',
    'utils_small': '建议 0.7，适当增加小模型的创造性',
    'emotion': '建议 0.7，让情绪变化更自然',
    'tool_use': '建议 0.7，工具调用需要一定灵活性',
    'lpmm_entity_extract': '建议 0.2，确保实体提取准确性',
    'lpmm_rdf_build': '建议 0.2，保证知识图谱构建质量',
    'lpmm_qa': '建议 0.7，问答需要一定创造性'
  }
  return recommendations[taskKey] || ''
}

const getSpecialConfigNote = (taskKey: string): string => {
  const notes: Record<string, string> = {
    'vlm': '图像识别模型，只需配置模型和最大Token数，不需要温度参数',
    'voice': '语音识别模型，只需配置模型，不需要温度和Token参数',
    'embedding': '嵌入模型，只需配置模型，用于向量化处理',
    'tool_use': '需要选择支持工具调用（Function Calling）的模型',
    'utils': '麦麦核心功能必需的模型，请选择稳定可靠的模型',
    'replyer': '主要回复模型，直接影响麦麦的对话质量'
  }
  return notes[taskKey] || ''
}

// 任务卡片样式相关方法
const getTaskCardClass = (taskKey: string): string => {
  const cardClasses: Record<string, string> = {
    'utils': 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/50',
    'utils_small': 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:border-cyan-800/50',
    'replyer': 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800/50',
    'planner': 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800/50',
    'planner_small': 'bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800/50',
    'emotion': 'bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800/50',
    'vlm': 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800/50',
    'voice': 'bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800/50',
    'tool_use': 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800/50',
    'embedding': 'bg-gray-50 border-gray-200 dark:bg-gray-800/30 dark:border-gray-700/50',
    'lpmm_entity_extract': 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50',
    'lpmm_rdf_build': 'bg-lime-50 border-lime-200 dark:bg-lime-950/30 dark:border-lime-800/50',
    'lpmm_qa': 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50'
  }
  return cardClasses[taskKey] || 'bg-base-200'
}

const getTaskIconClass = (taskKey: string): string => {
  const iconClasses: Record<string, string> = {
    'utils': 'bg-primary text-primary-content',
    'utils_small': 'bg-secondary text-secondary-content',
    'replyer': 'bg-success text-success-content',
    'planner': 'bg-accent text-accent-content',
    'planner_small': 'bg-accent text-accent-content',
    'emotion': 'bg-warning text-warning-content',
    'vlm': 'bg-info text-info-content',
    'voice': 'bg-primary text-primary-content',
    'tool_use': 'bg-secondary text-secondary-content',
    'embedding': 'bg-neutral text-neutral-content',
    'lpmm_entity_extract': 'bg-warning text-warning-content',
    'lpmm_rdf_build': 'bg-success text-success-content',
    'lpmm_qa': 'bg-info text-info-content'
  }
  return iconClasses[taskKey] || 'bg-primary text-primary-content'
}

const getTaskIcon = (taskKey: string): string => {
  const icons: Record<string, string> = {
    'utils': 'mdi:tools',
    'utils_small': 'mdi:wrench',
    'replyer': 'mdi:message-reply',
    'planner': 'mdi:brain',
    'planner_small': 'mdi:head-lightbulb',
    'emotion': 'mdi:emoticon-happy',
    'vlm': 'mdi:image-multiple',
    'voice': 'mdi:microphone',
    'tool_use': 'mdi:hammer-wrench',
    'embedding': 'mdi:vector-arrange-below',
    'lpmm_entity_extract': 'mdi:text-search',
    'lpmm_rdf_build': 'mdi:graph',
    'lpmm_qa': 'mdi:help-circle'
  }
  return icons[taskKey] || 'mdi:cog'
}

const getTaskTypeClass = (taskKey: string): string => {
  if (taskKey.startsWith('lpmm_')) {
    return 'badge-warning'
  }
  if (['utils', 'utils_small', 'replyer'].includes(taskKey)) {
    return 'badge-primary'
  }
  if (['planner', 'planner_small'].includes(taskKey)) {
    return 'badge-secondary'
  }
  if (['vlm', 'voice', 'embedding'].includes(taskKey)) {
    return 'badge-info'
  }
  return 'badge-accent'
}

const getTaskCategory = (taskKey: string): string => {
  if (taskKey.startsWith('lpmm_')) {
    return 'LPMM知识库'
  }
  if (['utils', 'utils_small', 'replyer'].includes(taskKey)) {
    return '核心功能'
  }
  if (['planner', 'planner_small'].includes(taskKey)) {
    return '决策系统'
  }
  if (['vlm', 'voice', 'embedding'].includes(taskKey)) {
    return '专用模型'
  }
  if (['emotion', 'tool_use'].includes(taskKey)) {
    return '扩展功能'
  }
  return '其他'
}

// 生命周期
onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
/* 任务卡片颜色样式 */
.bg-blue-50 {
  background-color: rgb(239 246 255);
}
.border-blue-200 {
  border-color: rgb(191 219 254);
}
.bg-cyan-50 {
  background-color: rgb(236 254 255);
}
.border-cyan-200 {
  border-color: rgb(165 243 252);
}
.bg-green-50 {
  background-color: rgb(240 253 244);
}
.border-green-200 {
  border-color: rgb(187 247 208);
}
.bg-purple-50 {
  background-color: rgb(250 245 255);
}
.border-purple-200 {
  border-color: rgb(221 214 254);
}
.bg-violet-50 {
  background-color: rgb(245 243 255);
}
.border-violet-200 {
  border-color: rgb(221 214 254);
}
.bg-pink-50 {
  background-color: rgb(253 242 248);
}
.border-pink-200 {
  border-color: rgb(251 207 232);
}
.bg-orange-50 {
  background-color: rgb(255 247 237);
}
.border-orange-200 {
  border-color: rgb(254 215 170);
}
.bg-teal-50 {
  background-color: rgb(240 253 250);
}
.border-teal-200 {
  border-color: rgb(153 246 228);
}
.bg-indigo-50 {
  background-color: rgb(238 242 255);
}
.border-indigo-200 {
  border-color: rgb(199 210 254);
}
.bg-amber-50 {
  background-color: rgb(255 251 235);
}
.border-amber-200 {
  border-color: rgb(253 230 138);
}
.bg-lime-50 {
  background-color: rgb(247 254 231);
}
.border-lime-200 {
  border-color: rgb(217 249 157);
}
.bg-emerald-50 {
  background-color: rgb(236 253 245);
}
.border-emerald-200 {
  border-color: rgb(167 243 208);
}

/* 暗色模式适配 */
[data-theme="dark"] .bg-blue-50,
.dark .bg-blue-50 {
  background-color: rgba(30, 58, 138, 0.3);
}
[data-theme="dark"] .border-blue-200,
.dark .border-blue-200 {
  border-color: rgba(30, 64, 175, 0.5);
}
[data-theme="dark"] .bg-cyan-50,
.dark .bg-cyan-50 {
  background-color: rgba(22, 78, 99, 0.3);
}
[data-theme="dark"] .border-cyan-200,
.dark .border-cyan-200 {
  border-color: rgba(21, 94, 117, 0.5);
}
[data-theme="dark"] .bg-green-50,
.dark .bg-green-50 {
  background-color: rgba(20, 83, 45, 0.3);
}
[data-theme="dark"] .border-green-200,
.dark .border-green-200 {
  border-color: rgba(22, 101, 52, 0.5);
}
[data-theme="dark"] .bg-purple-50,
.dark .bg-purple-50 {
  background-color: rgba(88, 28, 135, 0.3);
}
[data-theme="dark"] .border-purple-200,
.dark .border-purple-200 {
  border-color: rgba(107, 33, 168, 0.5);
}
[data-theme="dark"] .bg-violet-50,
.dark .bg-violet-50 {
  background-color: rgba(76, 29, 149, 0.3);
}
[data-theme="dark"] .border-violet-200,
.dark .border-violet-200 {
  border-color: rgba(91, 33, 182, 0.5);
}
[data-theme="dark"] .bg-pink-50,
.dark .bg-pink-50 {
  background-color: rgba(131, 24, 67, 0.3);
}
[data-theme="dark"] .border-pink-200,
.dark .border-pink-200 {
  border-color: rgba(157, 23, 77, 0.5);
}
[data-theme="dark"] .bg-orange-50,
.dark .bg-orange-50 {
  background-color: rgba(154, 52, 18, 0.3);
}
[data-theme="dark"] .border-orange-200,
.dark .border-orange-200 {
  border-color: rgba(194, 65, 12, 0.5);
}
[data-theme="dark"] .bg-teal-50,
.dark .bg-teal-50 {
  background-color: rgba(19, 78, 74, 0.3);
}
[data-theme="dark"] .border-teal-200,
.dark .border-teal-200 {
  border-color: rgba(17, 94, 89, 0.5);
}
[data-theme="dark"] .bg-indigo-50,
.dark .bg-indigo-50 {
  background-color: rgba(55, 48, 163, 0.3);
}
[data-theme="dark"] .border-indigo-200,
.dark .border-indigo-200 {
  border-color: rgba(67, 56, 202, 0.5);
}
[data-theme="dark"] .bg-amber-50,
.dark .bg-amber-50 {
  background-color: rgba(146, 64, 14, 0.3);
}
[data-theme="dark"] .border-amber-200,
.dark .border-amber-200 {
  border-color: rgba(180, 83, 9, 0.5);
}
[data-theme="dark"] .bg-lime-50,
.dark .bg-lime-50 {
  background-color: rgba(54, 83, 20, 0.3);
}
[data-theme="dark"] .border-lime-200,
.dark .border-lime-200 {
  border-color: rgba(77, 124, 15, 0.5);
}
[data-theme="dark"] .bg-emerald-50,
.dark .bg-emerald-50 {
  background-color: rgba(6, 78, 59, 0.3);
}
[data-theme="dark"] .border-emerald-200,
.dark .border-emerald-200 {
  border-color: rgba(5, 150, 105, 0.5);
}

/* 卡片悬停效果 */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* 任务图标动画 */
.task-icon {
  transition: all 0.3s ease;
}

.task-icon:hover {
  transform: scale(1.1);
}

/* 滑块样式增强 */
.range {
  transition: all 0.2s ease;
}

.range:hover {
  filter: brightness(1.1);
}

/* 徽章动画 */
.badge {
  transition: all 0.2s ease;
}

.badge:hover {
  transform: scale(1.05);
}

/* 温度建议文本样式 */
.temperature-hint {
  background: linear-gradient(135deg, hsl(var(--p) / 0.1), hsl(var(--s) / 0.1));
  border-radius: 0.375rem;
  padding: 0.5rem;
  margin-top: 0.5rem;
}

/* 特殊配置提示样式 */
.config-note {
  background: linear-gradient(135deg, hsl(var(--in) / 0.1), hsl(var(--su) / 0.1));
  border: 1px solid hsl(var(--in) / 0.2);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-top: 0.75rem;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .grid-cols-1.md\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  .text-lg {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .space-y-6 {
    gap: 1rem;
  }
  
  .card-body {
    padding: 0.75rem;
  }
  
  .btn {
    font-size: 0.75rem;
    padding: 0.5rem 1rem;
  }
}
</style>
