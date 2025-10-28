import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  useCreateStockMutation,
  useUpdateStockMutation,
  useRecordStockChangeMutation,
} from "../services/api/stocksApi";
import { Add, Remove } from "@mui/icons-material";

const schema = yup.object().shape({
  type: yup.string().required("Item name is required"),
  category: yup.string().oneOf([
    "Engine Oil", 
    "Tire Rotation", 
    "Spark Plug", 
    "Brake", 
    "Battery", 
    "Timing Belt", 
    "Clutch"
  ]).required("Category is required"),
  price: yup.number().required("Price is required").min(0),
  quantity: yup.number().min(0).nullable(),
});

export default function StockForm({ stockToEdit }) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      type: stockToEdit?.type || "",
      category: stockToEdit?.category || "",
      price: stockToEdit?.price || "",
      quantity: stockToEdit?.quantity || 0,
    },
  });

  const navigate = useNavigate();
  const [createStock, { isLoading: isCreating }] = useCreateStockMutation();
  const [updateStock, { isLoading: isUpdating }] = useUpdateStockMutation();
  const [recordChange] = useRecordStockChangeMutation();

  const currentQuantity = watch("quantity") || 0;

  const handleQuantityChange = (change) => {
    const currentValue = getValues("quantity") || 0;
    const newValue = currentValue + change;
    if (newValue >= 0) {
      setValue("quantity", newValue);
    }
  };

  const onSubmit = async (data) => {
    try {
      let message = "";
      if (stockToEdit) {
        const quantityChange = data.quantity - stockToEdit.quantity;
        
        // Update stock with new quantity
        await updateStock({ 
          id: stockToEdit.id, 
          type: data.type,
          category: data.category,
          price: data.price,
          quantity: data.quantity // Include quantity in update
        }).unwrap();

        // If quantity changed, record it in history
        if (quantityChange !== 0) {
          const operation = quantityChange > 0 ? 'restock' : 'usage';
          const changeAmount = Math.abs(quantityChange);
          
          await recordChange({
            id: stockToEdit.id,
            change: changeAmount,
            operation
          }).unwrap();
        }
        
        message = "Stock item updated successfully!";
      } else {
        const { quantity, ...newStock } = data;
        await createStock(newStock).unwrap();
        message = "Stock item created successfully!";
      }
      navigate("/manage-stocks", {
        state: { alert: { severity: "success", message } },
      });
    } catch (error) {
      console.error('Update error:', error);
      navigate("/manage-stocks", {
        state: {
          alert: { 
            severity: "error", 
            message: `Error: ${error.data?.message || error.message || 'Unknown error'}` 
          },
        },
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <Typography variant="h6">
            {stockToEdit ? "Edit Stock Item" : "Create Stock Item"}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Item Name"
                fullWidth
                error={!!errors.type}
                helperText={errors.type?.message}
                required
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select 
                  {...field} 
                  label="Category" 
                  error={!!errors.category}
                >
                  <MenuItem value="Engine Oil">Engine Oil</MenuItem>
                  <MenuItem value="Tire Rotation">Tire Rotation</MenuItem>
                  <MenuItem value="Spark Plug">Spark Plug</MenuItem>
                  <MenuItem value="Brake">Brake</MenuItem>
                  <MenuItem value="Battery">Battery</MenuItem>
                  <MenuItem value="Timing Belt">Timing Belt</MenuItem>
                  <MenuItem value="Clutch">Clutch</MenuItem>
                </Select>
              )}
            />
            {errors.category && (
              <Typography color="error" variant="caption">
                {errors.category.message}
              </Typography>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Price"
                fullWidth
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
                error={!!errors.price}
                helperText={errors.price?.message}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₱</InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Grid>
        {stockToEdit && (
          <Grid item xs={12} md={6}>
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Quantity"
                  fullWidth
                  type="number"
                  inputProps={{ 
                    min: 0, 
                    step: 1,
                    readOnly: true
                  }}
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => handleQuantityChange(-1)}
                          size="large"
                          disabled={currentQuantity <= 0}
                        >
                          <Remove fontSize="large" />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleQuantityChange(1)}
                          size="large"
                        >
                          <Add fontSize="large" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
            {stockToEdit && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Current quantity: {stockToEdit.quantity} | New quantity: {currentQuantity} | 
                Change: {currentQuantity - stockToEdit.quantity > 0 ? '+' : ''}{currentQuantity - stockToEdit.quantity}
              </Typography>
            )}
          </Grid>
        )}
        <Grid item xs={12}>
          <Box display="flex" gap={2}>
            <Button
              type="submit"
              variant="contained"
              disabled={isCreating || isUpdating}
            >
              {stockToEdit ? "Update Stock" : "Create Stock"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/manage-stocks")}
            >
              Cancel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}