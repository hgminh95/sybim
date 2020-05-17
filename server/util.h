#pragma once

#include <string_view>
#include <vector>
#include <optional>

namespace str {

static constexpr bool has_prefix(std::string_view str, std::string_view prefix) {
  return str.rfind(prefix, 0) != std::string_view::npos;
};

static std::vector<std::string_view>
split(std::string_view strv, std::string_view delims = " ") {
  std::vector<std::string_view> output;
  size_t first = 0;

  while (first < strv.size()) {
    const auto second = strv.find_first_of(delims, first);

    if (first != second)
      output.emplace_back(strv.substr(first, second-first));

    if (second == std::string_view::npos)
      break;

    first = second + 1;
  }

  return output;
}

static std::optional<double> to_double(std::string_view &str_view) {
  std::string str{str_view};

  char *end = nullptr;
  auto res = strtod(str.data(), &end);

  if (end == str.data())
    return std::nullopt;

  return res;
}

}  // namespace str
