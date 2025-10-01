import { useParams } from "react-router-dom";
import { useFetchStockByIdQuery } from "../../services/api/stocksApi";
import StockForm from "../../forms/StockForm";
import { CircularProgress, Typography, Box } from "@mui/material";

const EditStock = () => {
  const { stockId } = useParams();
  const {
    data: stockToEdit,
    isLoading,
    isError,
    error,
  } = useFetchStockByIdQuery(stockId);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !stockToEdit) {
    return (
      <Typography variant="h6" color="error">
        {error?.data?.message || "Stock item not found"}
      </Typography>
    );
  }

  return <StockForm stockToEdit={stockToEdit} />;
};

export default EditStock;