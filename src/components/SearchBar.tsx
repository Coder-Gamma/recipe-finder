import React, { useState, useCallback } from "react";
import {
  Paper,
  InputBase,
  IconButton,
  Box,
  Fade,
  useTheme,
} from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search recipes by name, ingredients, or tags...",
  initialValue = "",
}) => {
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const theme = useTheme();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(value);
    },
    [value, onSearch]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setValue("");
      onSearch("");
    },
    [onSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setValue("");
        onSearch("");
      }
    },
    [onSearch]
  );

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 600,
        margin: "0 auto",
        transition: "all 0.3s ease",
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={isFocused ? 3 : 1}
        sx={{
          p: "2px 4px",
          display: "flex",
          alignItems: "center",
          width: "100%",
          borderRadius: 2,
          transition: "all 0.3s ease",
          border: isFocused
            ? `1px solid ${theme.palette.primary.main}`
            : "1px solid transparent",
          "&:hover": {
            boxShadow: theme.shadows[2],
          },
        }}
      >
        <IconButton
          type="submit"
          sx={{
            p: "10px",
            color: isFocused ? theme.palette.primary.main : "inherit",
          }}
          aria-label="search"
        >
          <SearchIcon />
        </IconButton>
        <InputBase
          sx={{
            ml: 1,
            flex: 1,
            "& input": {
              transition: "all 0.2s ease",
              "&::placeholder": {
                opacity: isFocused ? 1 : 0.7,
              },
            },
          }}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          inputProps={{
            "aria-label": "search recipes",
            spellCheck: "false",
          }}
        />
        <Fade in={value.length > 0}>
          <IconButton
            sx={{
              p: "10px",
              visibility: value.length > 0 ? "visible" : "hidden",
            }}
            aria-label="clear search"
            onClick={handleClear}
          >
            <ClearIcon />
          </IconButton>
        </Fade>
      </Paper>
    </Box>
  );
};

export default SearchBar;
