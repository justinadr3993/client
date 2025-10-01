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
  minStockLevel: yup.number().min(0).default(5),
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
      minStockLevel: stockToEdit?.minStockLevel || 5,
    },
  });

  const navigate = useNavigate();
  const [createStock, { isLoading: isCreating, error: createError }] = useCreateStockMutation();
  const [updateStock, { isLoading: isUpdating, error: updateError }] = useUpdateStockMutation();
  const [recordChange, { error: changeError }] = useRecordStockChangeMutation();

  const currentQuantity = watch("quantity");
  const minStockLevel = watch("minStockLevel");

  useEffect(() => {
    if (stockToEdit) {
      reset({
        type: stockToEdit.type,
        category: stockToEdit.category,
        price: stockToEdit.price,
        quantity: stockToEdit.quantity,
        minStockLevel: stockToEdit.minStockLevel || 5,
      });
    }
  }, [stockToEdit, reset]);

  const handleQuantityChange = (change) => {
    const currentValue = getValues("quantity") || 0;
    const newValue = currentValue + change;
    if (newValue >= 0) {
      setValue("quantity", newValue);
    }
  };

  const getError = () => {
    return createError || updateError || changeError;
  };

  const onSubmit = async (data) => {
    try {
      let message = "";
      if (stockToEdit) {
        const quantityChange = data.quantity - stockToEdit.quantity;
        
        // Update stock with all fields except quantity
        const updateData = {
          id: stockToEdit._id,
          type: data.type,
          category: data.category,
          price: data.price,
          minStockLevel: data.minStockLevel
        };

        await updateStock(updateData).unwrap();

        // If quantity changed, record it in history
        if (quantityChange !== 0) {
          const operation = quantityChange > 0 ? 'restock' : 'usage';
          await recordChange({
            id: stockToEdit._id,
            change: Math.abs(quantityChange),
            operation
          }).unwrap();
        }
        
        message = "Stock item updated successfully!";
      } else {
        await createStock(data).unwrap();
        message = "Stock item created successfully!";
      }
      
      navigate("/manage-stocks", {
        state: { alert: { severity: "success", message } },
      });
    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling is done through the error state
    }
  };

  const isLowStock = currentQuantity <= minStockLevel;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <Typography variant="h6">
            {stockToEdit ? "Edit Stock Item" : "Create Stock Item"}
          </Typography>
        </Grid>

        {getError() && (
          <Grid item xs={12}>
            <Alert severity="error">
              {getError().data?.message || 'An error occurred'}
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
                <Select {...field} label="Category">
                  <MenuItem value="Oil">Oil</MenuItem>
                  <MenuItem value="Tire">Tire</MenuItem>
                  <MenuItem value="Brake">Brake</MenuItem>
                  <MenuItem value="Filter">Filter</MenuItem>
                  <MenuItem value="Battery">Battery</MenuItem>
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
            name="minStockLevel"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Minimum Stock Level"
                fullWidth
                type="number"
                inputProps={{ min: 0, step: 1 }}
                error={!!errors.minStockLevel}
                helperText={errors.minStockLevel?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            )}
          />
        </Grid>

        {stockToEdit && (
          <Grid item xs={12}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: isLowStock ? 'error.main' : 'success.main', borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Controller
                    name="quantity"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Current Quantity"
                        fullWidth
                        type="number"
                        inputProps={{ 
                          min: 0, 
                          step: 1,
                          readOnly: true
                        }}
                        error={!!errors.quantity}
                        helperText={
                          isLowStock 
                            ? `Low stock! Current quantity (${currentQuantity}) is at or below minimum (${minStockLevel})`
                            : errors.quantity?.message
                        }
                        sx={{
                          '& .MuiInputBase-input': {
                            color: isLowStock ? 'error.main' : 'inherit',
                            fontWeight: isLowStock ? 'bold' : 'normal'
                          }
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box display="flex" gap={1} alignItems="center">
                    <Typography variant="body2">Adjust Quantity:</Typography>
                    <IconButton 
                      onClick={() => handleQuantityChange(-1)}
                      color="error"
                      disabled={currentQuantity <= 0}
                    >
                      <Remove />
                    </IconButton>
                    <Typography variant="body1" sx={{ minWidth: 40, textAlign: 'center' }}>
                      {currentQuantity}
                    </Typography>
                    <IconButton 
                      onClick={() => handleQuantityChange(1)}
                      color="success"
                    >
                      <Add />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        )}

        {!stockToEdit && (
          <Grid item xs={12} md={6}>
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Initial Quantity"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              )}
            />
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