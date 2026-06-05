#!/usr/bin/env ruby
# frozen_string_literal: true

require "yaml"
require "pathname"

ROOT = Pathname.new(__dir__).parent

def load_yaml(path)
  YAML.safe_load(path.read, aliases: true) || {}
end

def front_matter(path)
  text = path.read
  match = text.match(/\A---\s*\n(.*?)\n---\s*\n/m)
  match ? YAML.safe_load(match[1], aliases: true) || {} : {}
end

def fail_with(message)
  warn "site structure validation failed: #{message}"
  exit 1
end

config = load_yaml(ROOT.join("_config.yml"))
sections_path = ROOT.join("_data", "sections.yml")
fail_with("missing _data/sections.yml") unless sections_path.file?

sections = load_yaml(sections_path)
fail_with("_data/sections.yml must be a list") unless sections.is_a?(Array)

keys = sections.map { |section| section["key"] }
key_counts = Hash.new(0)
keys.each { |key| key_counts[key] += 1 }
duplicates = key_counts.select { |_key, count| count > 1 }.keys
fail_with("duplicate section keys: #{duplicates.join(', ')}") unless duplicates.empty?

configured_collections = (config["collections"] || {}).keys + ["posts"]

sections.each do |section|
  %w[key title url description].each do |field|
    fail_with("section #{section.inspect} is missing #{field}") if section[field].to_s.strip.empty?
  end

  url = section["url"]
  fail_with("section #{section['key']} url must start with /") unless url.start_with?("/")

  collection = section["collection"]
  next unless collection

  fail_with("section #{section['key']} references unknown collection #{collection}") unless configured_collections.include?(collection)
end

landing_pages = ROOT.children.select { |path| path.file? && %w[.md .html].include?(path.extname) }
landing_pages.each do |path|
  fm = front_matter(path)
  key = fm["collection_key"]
  next unless key

  fail_with("#{path.basename} has unknown collection_key #{key}") unless keys.include?(key)
end

nav_sections = sections.select { |section| section["nav"] }
nav_sections.each do |section|
  url = section["url"]
  next if url.start_with?("http://", "https://", "mailto:")

  permalink_exists = landing_pages.any? { |path| front_matter(path)["permalink"] == url }
  directory_exists = ROOT.join(url.delete_prefix("/")).directory?
  index_exists = ROOT.join(url.delete_prefix("/"), "index.html").file?

  fail_with("navigation target #{url} from section #{section['key']} has no page or directory") unless permalink_exists || directory_exists || index_exists
end

puts "site structure validation passed"
