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
  Alert,
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
  category: yup.string().required("Category is required"),
  price: yup.number().required("Price is required").min(0),
  quantity: yup.number().min(0).default(0),
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
  const [createStock, { isLoading: isCreating, error: createError }] = useCreateStockMutation();
  const [updateStock, { isLoading: isUpdating, error: updateError }] = useUpdateStockMutation();
  const [recordChange, { error: recordError }] = useRecordStockChangeMutation();

  const currentQuantity = watch("quantity");
  const error = createError || updateError || recordError;

  const handleQuantityChange = async (change) => {
    const currentValue = getValues("quantity") || 0;
    const newValue = currentValue + change;
    
    if (newValue >= 0) {
      setValue("quantity", newValue);
      
      // If editing existing stock, record the change immediately
      if (stockToEdit && change !== 0) {
        try {
          const operation = change > 0 ? 'restock' : 'usage';
          await recordChange({
            id: stockToEdit.id,
            change: Math.abs(change),
            operation
          }).unwrap();
        } catch (error) {
          console.error('Failed to record stock change:', error);
          // Revert the quantity change if recording fails
          setValue("quantity", currentValue);
        }
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      let message = "";
      
      if (stockToEdit) {
        // For existing stock, update basic info (quantity is handled separately via recordChange)
        await updateStock({ 
          id: stockToEdit.id, 
          type: data.type,
          category: data.category,
          price: data.price
        }).unwrap();
        
        message = "Stock item updated successfully!";
      } else {
        // For new stock, include initial quantity
        await createStock(data).unwrap();
        message = "Stock item created successfully!";
      }
      
      navigate("/manage-stocks", {
        state: { alert: { severity: "success", message } },
      });
    } catch (error) {
      console.error('Form submission error:', error);
      // Error will be displayed via the error state
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

        {error && (
          <Grid item xs={12}>
            <Alert severity="error">
              {error.data?.message || error.message || 'An error occurred'}
            </Alert>
          </Grid>
        )}
        
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
          <FormControl fullWidth required error={!!errors.category}>
            <InputLabel>Category</InputLabel>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select 
                  {...field} 
                  label="Category" 
                >
                  <MenuItem value="Oil">Oil</MenuItem>
                  <MenuItem value="Tire">Tire</MenuItem>
                  <MenuItem value="Brake">Brake</MenuItem>
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
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
        
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
                value={currentQuantity}
                inputProps={{ 
                  min: 0, 
                  step: 1,
                  readOnly: !stockToEdit // Only allow quantity changes for existing items via buttons
                }}
                error={!!errors.quantity}
                helperText={errors.quantity?.message}
                InputProps={stockToEdit ? {
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
                } : {}}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            )}
          />
          {stockToEdit && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Use +/- buttons to adjust quantity (changes are recorded in history)
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12}>
          <Box display="flex" gap={2}>
            <Button
              type="submit"
              variant="contained"
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? "Saving..." : stockToEdit ? "Update Stock" : "Create Stock"}
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