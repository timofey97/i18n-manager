package main

import (
	"encoding/json"
	"os"

	"github.com/bregydoc/gtranslate"
)

type TranslateRequest struct {
	Text string `json:"text"`
	To   string `json:"to"`
}

type TranslateResponse struct {
	TranslatedText string `json:"translatedText"`
	Status         bool   `json:"status"`
	Message        string `json:"message"`
}

func main() {
	var req TranslateRequest

	// Читаем JSON из stdin
	err := json.NewDecoder(os.Stdin).Decode(&req)
	if err != nil {
		outputError("Invalid JSON input")
		return
	}

	translated, err := gtranslate.TranslateWithParams(req.Text, gtranslate.TranslationParams{
		From: "auto",
		To:   req.To,
	})
	if err != nil {
		outputError("Translation failed")
		return
	}

	res := TranslateResponse{
		TranslatedText: translated,
		Status:         true,
		Message:        "",
	}

	_ = json.NewEncoder(os.Stdout).Encode(res)
}

func outputError(message string) {
	res := TranslateResponse{
		Status:  false,
		Message: message,
	}
	_ = json.NewEncoder(os.Stdout).Encode(res)
}
