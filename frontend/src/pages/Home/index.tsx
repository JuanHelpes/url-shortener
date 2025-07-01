import React, { useState } from "react";
import { io } from "socket.io-client";
import { ContentCopy, Delete } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridRenderCellParams } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import api from "../../services/api"; // Importando a instância do Axios
import {
    Box,
    Button,
    Container,
    IconButton,
    Paper,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

interface UrlItem {
    _id: string; // ID gerado pela API
    url_short: string;
    url_original: string;
    clicks: number;
    creationDate?: string;
    expireDate: string;
}

const initialUrls: UrlItem[] = [];
const socket = io("http://localhost:3333"); // ou URL do seu backend
const apiUrl = "http://localhost:3333/api/"; // URL base da API

export default function Home() {
    const [url, setUrl] = useState("");
    const [urls, setUrls] = useState(initialUrls);

    const listUrls = async () => {
        try {
            const response = await api.get("/api/");
            setUrls(response.data as typeof initialUrls);
        } catch (error) {
            console.error("Erro ao buscar URLs:", error);
        }
    }

    React.useEffect(() => {
        // Chama a função para listar URLs ao montar o componente
        listUrls();
    }, []);


    React.useEffect(() => {

        // Evento quando os cliques forem atualizados
        socket.on("clickUpdated", (updatedUrl) => {
            setUrls((prev) =>
                prev.map((url) =>
                    url._id === updatedUrl._id ? { ...url, clicks: updatedUrl.clicks } : url
                )
            );
        });

        return () => {
            socket.off("clickUpdated");
        };

    }, []);

    const handleShorten = () => {
        // Simulação de encurtamento (apenas adiciona à lista)
        if (!url) return;


        interface ShortenResponse {
            _id: string; // ID gerado pela API
            url_short: string;
            url_original: string;
            clicks: number;
            creationDate: string;
            expireDate: string;
        }

        const response = api.post<ShortenResponse>("/api/shorten", { url_original: url });

        response.then((res) => {
            const newUrl = {
                _id: res.data._id,
                url_original: url,
                url_short: res.data.url_short, // Supondo que a API retorne o shortUrl
                clicks: 0,
                expireDate: res.data.expireDate, // Supondo que a API retorne a validade
            };
            setUrls([...urls, newUrl]);
        }).catch((error) => {
            console.error("Erro ao encurtar URL:", error);
        });

        setUrl(""); // Limpa o campo de entrada após encurtar

    };

    const handleCopy = (shortUrl: string) => {
        navigator.clipboard.writeText(shortUrl);
    };

    const handleDelete = (url_short: number) => {
        setUrls(urls.filter((u) => u.url_short !== String(url_short)));
        api.delete(`/api/${url_short}`)
            .then(() => {
                console.log("URL deletada com sucesso");
            })
            .catch((error) => {
                console.error("Erro ao deletar URL:", error);
            });
    };

    const columns: GridColDef[] = [
        { field: "url_original", headerName: "URL Original", flex: 2, minWidth: 200 },
        {
            field: "url_short",
            headerName: "URL Encurtada",
            flex: 2,
            minWidth: 180,
            renderCell: (params: GridRenderCellParams) => (
                <a
                    href={apiUrl + params.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", color: "#1976d2" }}
                >
                    {apiUrl + params.value}
                </a>
            )
        },
        { field: "clicks", headerName: "Clicks", width: 90 },
        {
            field: "expireDate", headerName: "Validade", width: 160,
            renderCell: (params) => {
                const rawValue = params.value;

                if (!rawValue) return "—";

                const date = new Date(rawValue);

                if (isNaN(date.getTime())) return "Data inválida";

                return date.toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                });
            }
        },
        {
            field: "copy",
            headerName: "",
            width: 60,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Tooltip title="Copiar link">
                    <IconButton
                        onClick={() => handleCopy(apiUrl + params.row.url_short)}
                        size="small"
                    >
                        <ContentCopy fontSize="small" />
                    </IconButton>
                </Tooltip>
            ),
        },
        {
            field: "delete",
            headerName: "",
            width: 60,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Tooltip title="Excluir">
                    <IconButton
                        onClick={() => handleDelete(params.row.url_short)}
                        size="small"
                        color="error"
                    >
                        <Delete fontSize="small" />
                    </IconButton>
                </Tooltip>
            ),
        },
    ];

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <Paper sx={{ p: 4, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Encurtador de URL
                </Typography>
                <Box display="flex" gap={2}>
                    <TextField
                        label="Cole sua URL aqui"
                        variant="outlined"
                        fullWidth
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleShorten()}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleShorten}
                        sx={{ minWidth: 120 }}
                    >
                        Encurtar
                    </Button>
                </Box>
            </Paper>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    URLs Encurtadas
                </Typography>
                <Box sx={{ height: 400, width: "100%" }}>
                    <DataGrid
                        rows={urls}
                        getRowId={(row) => row._id} // Usando o ID correto do objeto
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: {
                                    pageSize: 5,
                                },
                            },
                        }}
                        pageSizeOptions={[5]}
                        disableRowSelectionOnClick
                    />
                </Box>
            </Paper>
        </Container>
    );
}