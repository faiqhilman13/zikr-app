require 'fileutils'
require 'xcodeproj'

ROOT = File.expand_path('..', __dir__)
PROJECT_PATH = File.join(ROOT, 'Zikr.xcodeproj')

FileUtils.rm_rf(PROJECT_PATH)
project = Xcodeproj::Project.new(PROJECT_PATH)
project.root_object.attributes['LastSwiftUpdateCheck'] = '1600'
project.root_object.attributes['LastUpgradeCheck'] = '1600'

main_group = project.main_group
main_group.set_source_tree('SOURCE_ROOT')

sources_group = main_group.new_group('Sources', 'Sources')
core_group = sources_group.new_group('ZikrCore', 'ZikrCore')
app_group = main_group.new_group('ZikrApp', 'ZikrApp')
widget_group = main_group.new_group('ZikrWidgetExtension', 'ZikrWidgetExtension')
config_group = main_group.new_group('Config', 'Config')
scripts_group = main_group.new_group('Scripts', 'scripts')

core_target = project.new_target(:framework, 'ZikrCore', :ios, '17.0')
app_target = project.new_target(:application, 'Zikr', :ios, '17.0')
widget_target = project.new_target(:app_extension, 'ZikrWidgetExtension', :ios, '17.0')

[project, core_target, app_target, widget_target].each do |item|
  item.build_configurations.each do |config|
    config.build_settings['SWIFT_VERSION'] = '5.10'
    config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '17.0'
    config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
    config.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
    config.build_settings['DEVELOPMENT_TEAM'] = ''
  end
end

project.build_configuration_list.build_configurations.each do |config|
  config.build_settings['SWIFT_VERSION'] = '5.10'
  config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
end

core_target.build_configurations.each do |config|
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.faiqhilman.zikrcore'
  config.build_settings['PRODUCT_NAME'] = 'ZikrCore'
  config.build_settings['SKIP_INSTALL'] = 'YES'
  config.build_settings['DEFINES_MODULE'] = 'YES'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  config.build_settings['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@rpath']
end

app_target.build_configurations.each do |config|
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.faiqhilman.zikr'
  config.build_settings['PRODUCT_NAME'] = 'Zikr'
  config.build_settings['INFOPLIST_FILE'] = 'Config/ZikrApp-Info.plist'
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'Config/Zikr.entitlements'
  config.build_settings['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks']
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
  config.build_settings['SWIFT_EMIT_LOC_STRINGS'] = 'NO'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'NO'
end

widget_target.build_configurations.each do |config|
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.faiqhilman.zikr.widget'
  config.build_settings['PRODUCT_NAME'] = 'ZikrWidgetExtension'
  config.build_settings['INFOPLIST_FILE'] = 'Config/ZikrWidget-Info.plist'
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'Config/ZikrWidget.entitlements'
  config.build_settings['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
  config.build_settings['APPLICATION_EXTENSION_API_ONLY'] = 'YES'
  config.build_settings['SKIP_INSTALL'] = 'YES'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'NO'
end


def ensure_group(root_group, relative_folder)
  relative_folder.split('/').reject(&:empty?).reduce(root_group) do |group, component|
    group[component] || group.new_group(component, component)
  end
end

def add_source_file(root_group, relative_path, target)
  path_parts = relative_path.split('/')
  file_name = path_parts.pop
  folder = path_parts.join('/')
  parent_group = folder.empty? ? root_group : ensure_group(root_group, folder)
  file_ref = parent_group.find_file_by_path(file_name) || parent_group.new_file(file_name)
  target.source_build_phase.add_file_reference(file_ref, true)
  file_ref
end

def add_plain_reference(root_group, relative_path)
  path_parts = relative_path.split('/')
  file_name = path_parts.pop
  folder = path_parts.join('/')
  parent_group = folder.empty? ? root_group : ensure_group(root_group, folder)
  parent_group.find_file_by_path(file_name) || parent_group.new_file(file_name)
end

core_files = %w[
  ZikrModels.swift
  DayKey.swift
  StreakRewardEngine.swift
  ReminderPlanner.swift
  SharedZikrStore.swift
  CommunityRepository.swift
]

app_files = %w[
  App/ZikrApp.swift
  App/RootView.swift
  App/ZikrAppViewModel.swift
  App/DhikrTheme.swift
  Services/FirebaseBootstrap.swift
  Services/NotificationScheduler.swift
  Services/LiveActivityManager.swift
  Features/Onboarding/OnboardingView.swift
  Features/Counter/CounterView.swift
  Features/Timer/ZikrTimerView.swift
  Features/Rewards/RewardsView.swift
  Features/Garden/GardenView.swift
  Features/Circles/CirclesView.swift
  Features/History/HistoryView.swift
  Features/Settings/SettingsView.swift
]

shared_activity_files = %w[
  SharedActivity/ZikrActivityAttributes.swift
]

widget_files = %w[
  IncrementDhikrIntent.swift
  ZikrWidgetBundle.swift
]

config_files = %w[
  ZikrApp-Info.plist
  ZikrWidget-Info.plist
  Zikr.entitlements
  ZikrWidget.entitlements
]

core_files.each do |path|
  add_source_file(core_group, path, core_target)
end

app_files.each do |path|
  add_source_file(app_group, path, app_target)
end

shared_activity_files.each do |path|
  file_ref = add_plain_reference(app_group, path)
  app_target.source_build_phase.add_file_reference(file_ref, true)
  widget_target.source_build_phase.add_file_reference(file_ref, true)
end

widget_files.each do |path|
  add_source_file(widget_group, path, widget_target)
end

config_files.each do |path|
  add_plain_reference(config_group, path)
end

add_plain_reference(scripts_group, 'generate_xcodeproj.rb')

app_target.add_dependency(core_target)
widget_target.add_dependency(core_target)
app_target.add_dependency(widget_target)

framework_ref = core_target.product_reference
extension_ref = widget_target.product_reference

app_target.frameworks_build_phase.add_file_reference(framework_ref, true)
widget_target.frameworks_build_phase.add_file_reference(framework_ref, true)

app_embed_frameworks = app_target.copy_files_build_phases.find { |phase| phase.name == 'Embed Frameworks' } || app_target.new_copy_files_build_phase('Embed Frameworks')
app_embed_frameworks.symbol_dst_subfolder_spec = :frameworks
app_framework_build_file = app_embed_frameworks.add_file_reference(framework_ref, true)
app_framework_build_file.settings = { 'ATTRIBUTES' => ['CodeSignOnCopy', 'RemoveHeadersOnCopy'] }

widget_embed_frameworks = widget_target.copy_files_build_phases.find { |phase| phase.name == 'Embed Frameworks' } || widget_target.new_copy_files_build_phase('Embed Frameworks')
widget_embed_frameworks.symbol_dst_subfolder_spec = :frameworks
widget_framework_build_file = widget_embed_frameworks.add_file_reference(framework_ref, true)
widget_framework_build_file.settings = { 'ATTRIBUTES' => ['CodeSignOnCopy', 'RemoveHeadersOnCopy'] }

app_embed_plugins = app_target.copy_files_build_phases.find { |phase| phase.name == 'Embed App Extensions' } || app_target.new_copy_files_build_phase('Embed App Extensions')
app_embed_plugins.symbol_dst_subfolder_spec = :plug_ins
app_embed_plugins.add_file_reference(extension_ref, true)

project.save
