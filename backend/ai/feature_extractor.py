import torch
import torch.nn as nn
from torchvision.models import resnet18, ResNet18_Weights
from torchvision import transforms
from PIL import Image

class FeatureExtractor:
    """Extracts intermediate features from a pre-trained ResNet18 model using forward hooks."""
    def __init__(self):
        self.device = torch.device('cpu')
        self.model = resnet18(weights=ResNet18_Weights.DEFAULT).to(self.device)
        self.model.eval()

        self.features = []
        def hook(module, input, output):
            self.features.append(output)

        # ResNet18 layer2 and layer3
        self.model.layer2.register_forward_hook(hook)
        self.model.layer3.register_forward_hook(hook)

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=ResNet18_Weights.DEFAULT.transforms().mean, 
                                 std=ResNet18_Weights.DEFAULT.transforms().std)
        ])

    def extract(self, image: Image.Image):
        """Extract multi-scale features from a PIL Image."""
        self.features = [] # clear previous features
        img_t = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            self.model(img_t)

        # layer2: (1, 128, 28, 28), layer3: (1, 256, 14, 14)
        feat2 = self.features[0] 
        feat3 = self.features[1] 

        # Upsample feat3 to match feat2 (28x28)
        feat3 = nn.functional.interpolate(feat3, size=feat2.shape[2:], mode='bilinear', align_corners=False)

        # Concatenate: (1, 128+256=384, 28, 28)
        concatenated = torch.cat([feat2, feat3], dim=1) 
        return concatenated.squeeze(0).numpy() # (384, 28, 28)

