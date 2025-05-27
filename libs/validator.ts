import { withYup } from '@rvf/yup';
import * as Yup from 'yup';

export const loginValidator = withYup(
  Yup.object({
    email: Yup.string().required("Email is required").email("Invalid email"),
    password: Yup.string().required("Password is required").min(6, "Password must be at least 6 characters"),
  })
);

export const createFeedbackValidator = () => {
  return withYup(
    Yup.object({
      title: Yup.string()
        .required('Title is required')
        .min(3, 'Title must be at least 3 characters'),
      description: Yup.string()
        .required('Description is required')
        .min(10, 'Description must be at least 10 characters'),
      category: Yup.string()
        .required('Category is required')
        .oneOf(['Bug', 'Feature', 'Other'], 'Invalid category'),
    })
  );
};